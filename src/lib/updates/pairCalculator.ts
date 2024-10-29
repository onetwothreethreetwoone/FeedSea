import { pairsStore } from '../stores/stores';
import type { EmbeddingsState } from '$lib/types';

const TIMEOUT_INTERVAL = 60 * 1000;
let pairWorker: Worker | null = null;
let PairsWorkerModule: typeof import('$lib/workers/pairWorker?worker') | null = null;
let idleTimeout: ReturnType<typeof setTimeout>;
let workerInitializationPromise: Promise<Worker> | null = null;

async function initPairWorker(): Promise<Worker> {
    if (pairWorker) {
        return pairWorker;
    } else if (workerInitializationPromise) {
        // Wait for the ongoing initialization to complete
        return workerInitializationPromise;
    } else {
        // Start a new initialization
        workerInitializationPromise = (async () => {
            PairsWorkerModule = await import('$lib/workers/pairWorker?worker');
            pairWorker = new PairsWorkerModule.default();
            pairWorker.onmessage = (event) => {
                const newPairs = event.data;
                if (Object.values(newPairs).length > 0)
                    pairsStore.update(currentPairs => {
                        Object.assign(currentPairs.pairs, newPairs);
                        currentPairs.newPairs = newPairs;
                        return currentPairs;
                    });
                // resetWorkerIdleTimeout();
            };

            pairWorker.onerror = (error) =>
                console.error('Pair Worker error:', error);
            return pairWorker;
        })();
        const worker = await workerInitializationPromise;
        workerInitializationPromise = null; // Reset for future initializations
        return worker;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetWorkerIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(terminatePairWorker, TIMEOUT_INTERVAL);
}
function terminatePairWorker() {
    if (pairWorker) {
        pairWorker.terminate();
        pairWorker = null;
    }
}

async function postMessageToPairWorker(data: EmbeddingsState) {
    pairWorker = await initPairWorker();
    // clearTimeout(idleTimeout); // Clear the timeout when a new task starts
    pairWorker.postMessage(data);
}

async function calculateAllPairs(currentEmbeddingsState: EmbeddingsState) {
    await postMessageToPairWorker(currentEmbeddingsState);
}

export default calculateAllPairs;