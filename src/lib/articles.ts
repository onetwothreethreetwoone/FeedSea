import axios, { type AxiosResponse } from 'axios';
import { nanoid } from 'nanoid';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

import { EventEmitter } from 'events';
import { compress } from './compression';
import { hasSubscriber, removeSubscriber } from './updates/subscribers';

import fastq from 'fastq';
import type { done, queue } from 'fastq';
import type { FeedWithUnreadStories, ArticleType } from './types';

import { articlesLogger as logger } from '../logger';

const BATCH_INTERVAL = 5000;

interface ArticleTask {
    feedId: string;
    feedColor: string;
    story: string;
}

class Article implements ArticleType {
    id: string;
    feedId: string;
    feedColor: string;
    title: string;
    text: string;
    date: string;
    url: string;

    constructor() {
        this.id =  nanoid();
        this.feedId = '';
        this.feedColor = '';
        this.title = '';
        this.text = '';
        this.date = '';
        this.url = '';
    }
}

class Articles {
    private userAgent: string;
    private compress: typeof compress;
    public articleEvents: EventEmitter;
    public activeQueues: queue<ArticleTask>[] | null;

    constructor() {
        this.userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
        this.compress = compress;
        this.articleEvents = new EventEmitter();
        this.activeQueues = null;
    }

    private static instances: Map<string, Articles> = new Map();

    static getInstance(clientToken: string): Articles {
        if (!hasSubscriber(clientToken)) {
            throw new Error("Client not subscribed");
        }
        if (!this.instances.has(clientToken)) {
            this.instances.set(clientToken, new Articles());
        }
        return this.instances.get(clientToken)!;
    }

    static destroyInstance(clientToken: string): void {
        if (this.instances.has(clientToken)) {
            this.instances.delete(clientToken);
            removeSubscriber(clientToken);
        }
    }


    private preprocessHtml(html: string): string {
        html = html.replace(/<a href="([^"]+)"/g, '<a href="$1" target="_blank"');
        // Remove style tags and their content
        html = html.replace(/<style[^>]*>.*?<\/style>/gs, '');
        // Remove link tags for stylesheets
        html = html.replace(/<link rel="stylesheet"[^>]*>/gs, '');
        // Remove script tags and their content
        html = html.replace(/<script[^>]*>.*?<\/script>/gs, '');
        // Remove external script references
        html = html.replace(/<script src="[^"]+"><\/script>/gs, '');
        // Remove iframes
        html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gs, '');
        // Remove embeds
        html = html.replace(/<embed[^>]*>/gs, '');
        // Remove objects
        html = html.replace(/<object[^>]*>.*?<\/object>/gs, '');
        // Remove all event handlers from all tags
        html = html.replace(/ on\w+="[^"]*"/g, '');
        // Optional: Remove all attributes from img and video tags except for src (and potentially alt for img)
        html = html.replace(/<img [^>]*src="([^"]*)"[^>]*>/gi, '<img src="$1">');
        html = html.replace(/<video [^>]*src="([^"]*)"[^>]*>.*?<\/video>/gs, '<video src="$1"></video>');
        return html;
    }

    private async fetchArticle(task: ArticleTask): Promise<Article> {
        try {
            let response: AxiosResponse | null = null;
            let dom: JSDOM | null = null;
            let reader: Readability | null = null;
            let articleData = null;


            response = await axios.get(task.story, {
                headers: { 'User-Agent': this.userAgent },
                timeout: BATCH_INTERVAL,
            });

            if(!response) throw new Error('Failed to fetch article');
            
            dom = new JSDOM(this.preprocessHtml(response?.data), { url: task.story });
            reader = new Readability(dom.window.document);
            articleData = reader.parse();


            if (!articleData || !articleData.content || !articleData.title)
                throw new Error('Failed to extract article content. No article data returned.');

            const article = new Article();
            article.feedColor = task.feedColor;
            article.feedId = task.feedId;
            article.title = articleData.title;
            article.text = articleData.content;
            article.date = articleData.publishedTime;
            article.url = task.story;

            articleData = null;
            reader = null;
            dom = null;
            response = null;

            return article;
        } catch (error) {
            throw new Error('Error fetching or processing article.');
        }
    }


    private batch: Article[] = [];

    async worker(task: ArticleTask, done: done) {
        try {
            const article = await this.fetchArticle(task);
            this.batch.push(article);
        } catch (error) {
            if (error instanceof AggregateError)
                for (const err of error.errors)
                    logger.error(`Sub-error for feed ${task.feedId}:`, err);
            else logger.error(`Error processing task for feed ${task.feedId}:`, error);
        }
        done(null);
    }

    async queueFeedRequest(selectedFeed: FeedWithUnreadStories): Promise<void> {
        const concurrency = 1;
        let requestQueue: queue<ArticleTask> | null = fastq(this, this.worker, concurrency);
        if (!requestQueue) return;

        const sendBatch = () => {
            if (this.batch.length > 0) {
                const currentBatch = this.batch.splice(0, this.batch.length);
                const compressedBatch = this.compress(currentBatch);
                this.articleEvents.emit('articleFetched', compressedBatch);
            }
        };
        const batchTimer = setInterval(sendBatch, BATCH_INTERVAL);

        const processStoriesInBatches = async () => {
            for (let i = 0; i < selectedFeed.unreadStories.length; i++) {
                if (requestQueue) {
                    requestQueue.push({
                        feedId: selectedFeed.id.toString(),
                        feedColor: selectedFeed.color,
                        story: selectedFeed.unreadStories[i]
                    });

                    // Wait for the queue to drain if it reaches a certain size to control memory usage
                    if (i % concurrency === 0) {
                        await new Promise<void>(resolve => requestQueue!.drain = () => resolve(undefined));
                    }
                }
            }
        };

        await processStoriesInBatches();

        requestQueue.drain = () => {
            clearInterval(batchTimer);
            sendBatch();
            if (this.activeQueues) {
                this.activeQueues = this.activeQueues.filter(q => q !== requestQueue);
                if (this.activeQueues.length === 0) this.activeQueues = null;
            }
            requestQueue = null;
        };

        if (!this.activeQueues) this.activeQueues = [];
        this.activeQueues.push(requestQueue);
    }

    stopAllRequests(): void {
        this.activeQueues?.forEach(queue => {
            queue.kill();
        });
        this.activeQueues = [];
    }
}

const getArticleEvents = (clientToken: string) => Articles.getInstance(clientToken).articleEvents;

const queueFeedRequest = (selectedFeed: FeedWithUnreadStories, clientToken: string) =>
    Articles.getInstance(clientToken).queueFeedRequest(selectedFeed);

const stopAllRequests = (clientToken: string) => Articles.getInstance(clientToken).stopAllRequests();
const isActive = (clientToken: string) => Articles.getInstance(clientToken).activeQueues !== null;

export {
    Articles,
    getArticleEvents,
    queueFeedRequest,
    stopAllRequests,
    isActive
};