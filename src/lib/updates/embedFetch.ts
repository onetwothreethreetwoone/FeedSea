import { embeddingsStore } from '../stores/stores';
import type { ArticleType as Article, EmbeddingsCache } from '$lib/types';

const TIMEOUT_INTERVAL = 60 * 1000;
let idleTimeout: ReturnType<typeof setTimeout>;
let embedFetchWorker: Worker | null = null;

let workerInitializationPromise: Promise<Worker> | null = null;

async function initEmbedFetchWorker() {
    if (embedFetchWorker) {
        return embedFetchWorker;
    } else if (workerInitializationPromise) {
        return workerInitializationPromise;
    } else {
        workerInitializationPromise = (async () => {
            const EmbedFetchWorkerModule = await import('$lib/workers/embedFetchWorker?worker');
            embedFetchWorker = new EmbedFetchWorkerModule.default();
            const apiToken = localStorage.getItem('huggingfaceApiToken');
            if (apiToken) {
                embedFetchWorker.postMessage({ type: 'setApiToken', token: apiToken });
            }
            embedFetchWorker.onmessage = (event) => {
                const newEmbeddings: EmbeddingsCache = event.data;
                if (Object.keys(newEmbeddings).length > 0)
                    embeddingsStore.update((currentEmbeddings) => {
                        Object.assign(currentEmbeddings.embeddings, newEmbeddings);
                        currentEmbeddings.newEmbeddings = newEmbeddings;
                        return currentEmbeddings;
                    });
            };
            embedFetchWorker.onerror = (error) => {
                console.error('EmbedFetch Worker error:', error);
            };
            return embedFetchWorker;
        })();
        const worker = await workerInitializationPromise;
        workerInitializationPromise = null;
        return worker;
    }
}

function resetWorkerIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(terminateEmbedFetchWorker, TIMEOUT_INTERVAL);
}

function terminateEmbedFetchWorker() {
    if (embedFetchWorker) {
        embedFetchWorker.terminate();
        embedFetchWorker = null;
    }
}

async function postMessageToEmbedFetchWorker(articles: Article[]) {
    embedFetchWorker = await initEmbedFetchWorker();
    embedFetchWorker.postMessage(articles);
}

async function queueNewArticles(articles: Article[]) {
    await postMessageToEmbedFetchWorker(articles);
}

export default queueNewArticles;
