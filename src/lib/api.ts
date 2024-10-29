import axios, { type AxiosResponse } from 'axios';
import { feedsStore } from './stores/stores';
import type { FeedWithUnreadStories } from './types';


export async function callServerCleanUp(): Promise<AxiosResponse> {
    return axios.post('/cleanup', {}, { withCredentials: true });
}

export async function fetchFeeds() {
    const response = await axios.get('/feeds' , { withCredentials: true });
    feedsStore.set(response.data);
}

export async function selectFeed(feed: FeedWithUnreadStories): Promise<AxiosResponse> {
    return await axios.post("/select-feed", feed, { withCredentials: true });
}

