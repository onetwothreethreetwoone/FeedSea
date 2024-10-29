import type { Pair, EmbeddingsState, EmbeddingsCache } from "../types";

self.addEventListener('message', async (event) => {
    self.postMessage(await processPairs(event.data));
});

async function processPairs(task: EmbeddingsState): Promise<Record<string, Pair>> {
    const results: Record<string, Pair> = {};
    for (const pair of calculatePairsGenerator(task)) Object.assign(results, pair);
    return results;
}

function* calculatePairsGenerator(task: EmbeddingsState) {
    if (!task) return;
    const embeddings: EmbeddingsCache = task.embeddings;
    const newEmbeddings: EmbeddingsCache = task.newEmbeddings;
    const newEmbeddingKeys: string[] = Object.keys(newEmbeddings);
    const currentEmbeddingKeys: string[] = Object.keys(embeddings);

    for (let i = 0; i < newEmbeddingKeys.length; i++) {
        const newKey: string = newEmbeddingKeys[i];
        for (let j = 0; j < currentEmbeddingKeys.length; j++) {
            const currentKey: string = currentEmbeddingKeys[j];
            if (newKey === currentKey) continue;
            let dotProduct = 0.0, normA = 0.0, normB = 0.0;
            for (let k = 0, len = newEmbeddings[newKey].length; k < len; k++) {
                dotProduct += newEmbeddings[newKey][k] * embeddings[currentKey][k];
                normA += newEmbeddings[newKey][k] ** 2;
                normB += embeddings[currentKey][k] ** 2;
            }
            const similarity = (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) + 1) / 2;

            yield {
                [`${newKey}+${currentKey}`]: {
                    id1: newKey,
                    id2: currentKey,
                    similarity
                }
            };
        }
    }
}
