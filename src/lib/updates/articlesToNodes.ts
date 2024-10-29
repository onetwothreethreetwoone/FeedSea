import { nodesStore } from '../stores/stores';
import type { Node } from '$lib/types';

const TIMEOUT_INTERVAL = 60 * 1000;
let idleTimeout: ReturnType<typeof setTimeout>;
let nodesWorker: Worker | null = null;

let workerInitializationPromise: Promise<Worker> | null = null;

async function initNodesWorker(): Promise<Worker> {
    if (nodesWorker) {
        return nodesWorker;
    } else if (workerInitializationPromise) {
        // Wait for the ongoing initialization to complete
        return workerInitializationPromise;
    } else {
        // Start a new initialization
        workerInitializationPromise = (async () => {
            const NodesWorkerModule = await import('$lib/workers/nodesWorker?worker');
            nodesWorker = new NodesWorkerModule.default();
            nodesWorker.onmessage = (event: MessageEvent<Node[]>) => {
                const newNodes = event.data;
                nodesStore.update(currentNodes => {
                    newNodes.forEach((node: Node) =>
                        currentNodes.nodes.push(node));
                    currentNodes.newNodes = newNodes;
                    return currentNodes;
                });
                // resetWorkerIdleTimeout();
            };
            nodesWorker.onerror = (error) =>
                console.error('Nodes Worker error:', error);
            return nodesWorker;
        })();
        const worker = await workerInitializationPromise;
        workerInitializationPromise = null; // Reset for future initializations
        return worker;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetWorkerIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(terminateNodesWorker, TIMEOUT_INTERVAL);
}
function terminateNodesWorker() {
    if (nodesWorker) {
        nodesWorker.terminate();
        nodesWorker = null;
    }
}

async function queueArticlesToNodes(
    articles: { id: string, feedColor: string, title: string, date: string }[]
) {
    nodesWorker = await initNodesWorker();
    // clearTimeout(idleTimeout);
    nodesWorker.postMessage(articles);
}

export default queueArticlesToNodes;