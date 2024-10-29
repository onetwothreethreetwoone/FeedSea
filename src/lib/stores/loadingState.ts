import { writable } from 'svelte/store';

export const isLoadingFeeds = writable(false);
export const isLoadingArticles = writable(false);