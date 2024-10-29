import { linksStore } from '../stores/stores';
import type { Link, Pair } from '$lib/types';

const TIMEOUT_INTERVAL = 60 * 1000;
let linksWorker: Worker | null = null;
let idleTimeout: ReturnType<typeof setTimeout>;
let workerInitializationPromise: Promise<Worker> | null = null;

async function initLinksWorker(): Promise<Worker> {
    if (linksWorker) {
        return linksWorker;
    } else if (workerInitializationPromise) {
        // Wait for the ongoing initialization to complete
        return workerInitializationPromise;
    } else {
        // Start a new initialization
        workerInitializationPromise = (async () => {
            const LinksWorkerModule = await import('$lib/workers/linksWorker?worker');
            linksWorker = new LinksWorkerModule.default();
            linksWorker.onmessage = (event) => {
                const newLinks = event.data;
                if (Object.values(newLinks).length > 0)
                    linksStore.update(currentLinks => {
                        newLinks.forEach((link: Link) =>
                            currentLinks.links.push(link));
                        //Object.assign(currentLinks.links, newLinks);
                        currentLinks.newLinks = newLinks;
                        return currentLinks;
                    });
                // resetWorkerIdleTimeout();
            };

            linksWorker.onerror = (error) =>
                console.error('Links Worker error:', error);
            return linksWorker;
        })();
        const worker = await workerInitializationPromise;
        workerInitializationPromise = null; // Reset for future initializations
        return worker;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetWorkerIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(terminateLinksWorker, TIMEOUT_INTERVAL);
}
function terminateLinksWorker() {
    if (linksWorker) {
        linksWorker.terminate();
        linksWorker = null;
    }
}

async function postMessageToLinkWorker(
    nodes: { id: string, color: string }[], newPairs: Record<string, Pair>
) {
    linksWorker = await initLinksWorker();
    // clearTimeout(idleTimeout); // Clear the timeout when a new task starts
    linksWorker.postMessage({ nodes, newPairs });
}
async function queueNodesToLinks(nodes: { id: string, color: string }[], newPairs: Record<string, Pair>) {
    await postMessageToLinkWorker(nodes, newPairs);
}

export default queueNodesToLinks;