// import axios, { AxiosError, type AxiosResponse } from 'axios';
// // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
// import { serverLogger as logger } from '../../logger';
// import type { Feeds, Story, StoryWithColor,  } from '../../lib/types'


// const NEWSBLUR_URL = 'https://www.newsblur.com';

// interface Options {
//     page?: string;
//     order?: string;
//     include_hidden?: string;
// }




// class FeedsFetcher {
//     static instance: FeedsFetcher | null = null;
//     static getInstance() {
//         if (!this.instance) {
//             this.instance = new FeedsFetcher();
//         }
//         return this.instance;
//     }

//     isSessionValid: boolean;

//     constructor() {
//         this.isSessionValid = true;
//     }

//     async fetchWithSessionCookie(url: string, sessionCookie: string, options = {}) {
//         try {
//             const cookie = `newsblur_sessionid=${sessionCookie}`;
//             const response: AxiosResponse = await axios.get(url, {
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Cookie': cookie
//                 },
//                 withCredentials: true,
//                 ...options
//             });
//             return response.data;
//         } catch (error) {
//             if (error instanceof AxiosError) {
//                 if (!this.isSessionValid || (error.response && error.response.status === 403)) {
//                     this.isSessionValid = false;
//                     throw new Error('Session is invalid or expired');
//                 }
//             } else {
//                 throw error;
//             }
//         }
//     }


//     async fetchFeeds(sessionCookie: string): Promise<Feeds> {
//         const url = `${NEWSBLUR_URL}/reader/feeds`;
//         const data = await this.fetchWithSessionCookie(url, sessionCookie);
//         return data.feeds;
//     }


//     async fetchStories(
//         sessionCookie: string, feedId: string, color: string, options: Options = {}
//     ): Promise<StoryWithColor[]> {
//         const params = new URLSearchParams({
//             page: options.page || "1",
//             order: options.order || 'newest',
//             read_filter: 'unread',
//             include_hidden: options.include_hidden ? options.include_hidden : 'false',
//             include_story_content: 'false'
//         }).toString();

//         let allUnreadStories: Story[] = [];
//         let page = 1;
//         let hasMore = true;

//         while (hasMore) {
//             const url = `${NEWSBLUR_URL}/reader/feed/${feedId}?${params}&page=${page}`;
//             const data = await this.fetchWithSessionCookie(url, sessionCookie);
//             const stories: Story[] = data.stories || [];
//             allUnreadStories = allUnreadStories.concat(stories);
//             hasMore = stories.length > 0;
//             page++;
//         }

//         return allUnreadStories.map(story => ({ ...story, color }));
//     }
// }

// const feedsFetcherInstance = new FeedsFetcher();

// const fetchFeeds = (sessionCookie: string) => feedsFetcherInstance.fetchFeeds(sessionCookie);

// const fetchStories = (sessionCookie: string, feedId: string, color: string, options = {}) =>
//     feedsFetcherInstance.fetchStories(sessionCookie, feedId, color, options);

// export {
//     fetchFeeds,
//     fetchStories
// };

