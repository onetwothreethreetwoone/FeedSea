import type { ArticleType as Article, EmbeddingsCache } from '$lib/types';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { HUGGINGFACE_API_URL } from '../similarityConfig';

let huggingfaceApiToken: string = "";

const DEFAULT_QUEUE_TIME = 10; // in seconds
let articlesQueue: Article[] | null = [];
let isCooldownActive = false;

self.onmessage = async (event) => {
    if (event.data.type === 'setApiToken') {
        huggingfaceApiToken = event.data.token;
    } else {
        queueNewArticles(event.data);
    }
};

async function sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const MAX_RETRIES = 10;
const DEFAULT_WAIT_TIME = 30; // in seconds

async function retryRequest(
    articlesWithIds: Article[], retries: number, waitTime: number
): Promise<(AxiosResponse | Error)[]> {
    const responses: (AxiosResponse | Error)[] = [];
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post(
                HUGGINGFACE_API_URL,
                { inputs: articlesWithIds.map(article => `${article.title} ${article.text}`) },
                { headers: { 'Authorization': `Bearer ${huggingfaceApiToken}` } }
            );
            for (let i = 0; i < response.data.length; i++)
                responses.push(response.data[i]);
            break; // Break the loop on success
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const statusCode = error.response.status;
                if ([503, 502, 500, 429, 400].includes(statusCode) && i < retries - 1) {
                    const retryWaitTime = error.response.data.estimated_time || waitTime;
                    await sleep(retryWaitTime);
                } else {
                    responses.push(new Error(`Failed to retrieve embeddings: ${error.message}`));
                    break;
                }
            } else {
                responses.push(new Error(`Failed to retrieve embeddings: ${error}`));
                break;
            }
        }
    }
    return responses;
}

async function fetchEmbeddingsForArticles(articles: Article[]): Promise<EmbeddingsCache> {
    let responses: (AxiosResponse | Error)[] | null =
        await retryRequest(articles, MAX_RETRIES, DEFAULT_WAIT_TIME);
    const embeddings: EmbeddingsCache = {};
    for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response instanceof Error)
            console.warn(`Warning: Failed to retrieve embeddings for article ${articles[i].id}: ${response.message}`);
        else
            embeddings[articles[i].id] = response as unknown as number[];
    }
    responses = null;
    return embeddings;
}

async function processQueue() {
    if (articlesQueue && articlesQueue.length > 0) {
        isCooldownActive = true;
        try {
            let currentQueue: Article[] | null =
                articlesQueue.splice(0, articlesQueue.length);
            let newEmbeddings: EmbeddingsCache | null =
                await fetchEmbeddingsForArticles(currentQueue);
            self.postMessage(newEmbeddings);
            currentQueue = null;
            newEmbeddings = null;
        } catch (error) {
            console.error('Error processing embeddings:', error);
        } finally {
            setTimeout(() => {
                isCooldownActive = false;
                if (articlesQueue) {
                    if (articlesQueue.length > 0) processQueue();
                    else articlesQueue = null;
                }
            }, DEFAULT_QUEUE_TIME * 1000);
        }
    }
}

function queueNewArticles(articles: Article[]) {
    if (!articlesQueue) articlesQueue = [];

    for (let i = 0; i < articles.length; i++)
        articlesQueue.push(articles[i]);

    if (!isCooldownActive) processQueue();
}
