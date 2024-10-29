// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { serverLogger as logger } from '../../logger';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import type { Feeds, Story, StoryWithColor } from '../../lib/types';

const NEWSBLUR_URL = 'https://www.newsblur.com';

interface Options {
    page?: string;
    order?: string;
    include_hidden?: string;
}

class FeedsFetcher {
    private isSessionValid: boolean;
    private sessionCookie: string;
    private static instances: Map<string, FeedsFetcher> = new Map();

    private constructor(sessionCookie: string) {
        this.isSessionValid = true;
        this.sessionCookie = sessionCookie;
    }

    static getInstance(sessionCookie: string): FeedsFetcher {
        if (!this.instances.has(sessionCookie)) {
            this.instances.set(sessionCookie, new FeedsFetcher(sessionCookie));
        }
        return this.instances.get(sessionCookie)!;
    }

    static destroyInstance(sessionCookie: string): void {
        if (this.instances.has(sessionCookie)) {
            this.instances.delete(sessionCookie);
        }
    }

    async fetchWithSessionCookie(url: string, options = {}) {
        try {
            const cookie = `newsblur_sessionid=${this.sessionCookie}`;
            const response: AxiosResponse = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                withCredentials: true,
                ...options
            });
            return response.data;
        } catch (error) {
            if (error instanceof AxiosError) {
                if (!this.isSessionValid || (error.response && error.response.status === 403)) {
                    this.isSessionValid = false;
                    throw new Error('Session is invalid or expired');
                }
            } else {
                throw error;
            }
        }
    }

    async fetchFeeds(): Promise<Feeds> {
        const url = `${NEWSBLUR_URL}/reader/feeds`;
        const data = await this.fetchWithSessionCookie(url);
        return data.feeds;
    }

    async fetchStories(feedId: string, color: string, options: Options = {}): Promise<StoryWithColor[]> {
        let allUnreadStories: Story[] | null = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const params = new URLSearchParams({
                page: page.toString(),
                order: options.order || 'newest',
                read_filter: 'unread',
                include_hidden: options.include_hidden ? options.include_hidden : 'false',
                include_story_content: 'false'
            }).toString();
            const url = `${NEWSBLUR_URL}/reader/feed/${feedId}?${params}`;
            const data = await this.fetchWithSessionCookie(url);
            const stories: Story[] = data.stories || [];

            for (const story of stories)
                allUnreadStories.push(story);

            hasMore = stories.length > 0;
            page++;
        }

        const storiesWithColor: StoryWithColor[] = [];
        for (const story of allUnreadStories)
            storiesWithColor.push(Object.assign({}, story, { color: color }));

        allUnreadStories = null;
        return storiesWithColor;
    }
}

const fetchFeeds = (sessionCookie: string) => FeedsFetcher.getInstance(sessionCookie).fetchFeeds();
const fetchStories = (sessionCookie: string, feedId: string, color: string, options = {}) =>
    FeedsFetcher.getInstance(sessionCookie).fetchStories(feedId, color, options);

export {
    fetchFeeds,
    fetchStories
};