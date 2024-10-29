import { get } from 'svelte/store';
import { articleIdsStore, articlesStore, selectedArticleIds, selectedFeedIds, selectedFeedsStore } from './stores/stores';
import type { ArticleType, CompressedBatchesStoreType } from './types';

let eventSource: EventSource | null = null;

const TIMEOUT_INTERVAL = 60 * 1000;
let idleTimeout: ReturnType<typeof setTimeout>;
let decompressionWorker: Worker | null = null;

let workerInitializationPromise: Promise<Worker> | null = null;

async function initDecompressionWorker(): Promise<Worker> {
    if (decompressionWorker) {
        return decompressionWorker;
    } else if (workerInitializationPromise) {
        // Wait for the ongoing initialization to complete
        return workerInitializationPromise;
    } else {
        // Start a new initialization
        workerInitializationPromise = (async () => {
            const DecompressionWorkerModules = await import('$lib/workers/decompressionWorker?worker');
            decompressionWorker = new DecompressionWorkerModules.default();
            decompressionWorker.onmessage = (event) => {
                updateArticlesState(event.data);
                // resetWorkerIdleTimeout();
            };
            decompressionWorker.onerror = (error) =>
                console.error('Decompression Worker error:', error);
            return decompressionWorker;
        })();
        const worker = await workerInitializationPromise;
        workerInitializationPromise = null; // Reset for future initializations
        return worker;
    }
}
function updateArticlesState(
    data: { decompressedData: ArticleType[], compressedBatches: Record<string, string> }) {
    const {
        decompressedData: articlesBatch,
        compressedBatches: compressedMiniBatches
    } = data;



    articlesStore.update((currentArticles: CompressedBatchesStoreType) => {
        Object.entries(compressedMiniBatches).forEach(([feedId, compressedBatch]) => {
            (currentArticles[feedId] ||= []).push(compressedBatch);
        });
        return currentArticles;
    });


    // articlesStore.update(currentArticles => {
    //     for (const article of articlesBatch)
    //         (currentArticles[article.feedId] ||= []).push(article);
    //     return currentArticles;
    // });

    articleIdsStore.update(currentArticleIds => {
        for (const article of articlesBatch)
            (currentArticleIds[article.feedId] ||= new Set<string>()).add(article.id);
        return currentArticleIds;
    });
    selectedArticleIds.update(currentIds => {
        const feedIds = get(selectedFeedIds);
        const articleIds = get(articleIdsStore);
        const newSet = new Set<string>();
        for (const feedId of feedIds)
            if (articleIds[feedId].size > 0)
                for (const articleId of articleIds[feedId])
                    newSet.add(articleId);
        for (const article of articlesBatch)
            if (newSet.has(article.id))
                currentIds.add(article.id);
        return currentIds;
    });
    selectedFeedsStore.update(selectedFeedState => {
        selectedFeedState.change = {
            type: 'new',
            feedId: -1,
            articles: articlesBatch
        };
        return selectedFeedState;
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetWorkerIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(terminateDecompressionWorker, TIMEOUT_INTERVAL);
}
function terminateDecompressionWorker() {
    if (decompressionWorker) {
        decompressionWorker.terminate();
        decompressionWorker = null;
    }
}

async function postMessageToDecompressionWorker(data: string) {
    decompressionWorker = await initDecompressionWorker();
    // clearTimeout(idleTimeout); // Clear the timeout when a new task starts
    decompressionWorker.postMessage(data);
}

export function startSSE() {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('/events');
    eventSource.addEventListener('articleFetched', (event) => {
        const { compressedArticles } = JSON.parse(event.data);
        postMessageToDecompressionWorker(compressedArticles);
    });
}

export function stopSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    if (decompressionWorker) {
        decompressionWorker.terminate();
        decompressionWorker = null;
    }
}