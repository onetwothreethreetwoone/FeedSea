import { writable, type Writable } from 'svelte/store';

import type {
   SelectedFeedsState,
   EmbeddingsState,
   PairsState,
   FeedWithUnreadStories,
   // ArticleType as Article,
   NodeUpdate,
   LinkUpdate,
   CompressedBatchesStoreType
} from '$lib/types';

const feedCache: Record<string, FeedWithUnreadStories> = {};
const feedsStore = writable(feedCache);


const selectedFeeds = writable<FeedWithUnreadStories[]>([]);
const selectedArticleIds = writable(new Set<string>());
const selectedFeedIds = writable(new Set<string>());



// const articleCache: Record<string, Article[]> = {};
// const articlesStore = writable(articleCache);


const articlesStore: Writable<CompressedBatchesStoreType> = writable({});



const articleIdsStore = writable<Record<string, Set<string>>>({});

const initialEmbeddingsState: EmbeddingsState = {
   embeddings: {},
   newEmbeddings: {}
};
const embeddingsStore = writable<EmbeddingsState>(initialEmbeddingsState);

const initialState: SelectedFeedsState = {
   feedIds: new Set(),
   change: undefined
};
const selectedFeedsStore = writable<SelectedFeedsState>(initialState);

const initialPairsState: PairsState = {
   pairs: {},
   newPairs: {}
};
const pairsStore = writable<PairsState>(initialPairsState);


const initialNodeUpdate: NodeUpdate = {
   nodes: [],
   newNodes: []
};

const nodesStore = writable<NodeUpdate>(initialNodeUpdate);

const initialLinksUpdate: LinkUpdate = {
   links: [],
   newLinks: []
};
const linksStore = writable<LinkUpdate>(initialLinksUpdate);

const focusedArticleId = writable<string | null>(null);

const savedLinksPercentileValue = localStorage.getItem('linksPercentile');
const initialLinksPercentile = savedLinksPercentileValue ? JSON.parse(savedLinksPercentileValue) : 0.5;
const linksPercentile = writable<number>(initialLinksPercentile);

export {
   feedsStore,
   selectedArticleIds,
   selectedFeeds,
   selectedFeedIds,
   articlesStore,
   articleIdsStore,
   selectedFeedsStore,
   embeddingsStore,
   pairsStore,
   nodesStore,
   linksStore,
   focusedArticleId,
   linksPercentile
};