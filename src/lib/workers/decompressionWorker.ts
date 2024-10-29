import type { ArticleType } from '$lib/types';
import { decompress, compress } from '../compression';

self.addEventListener('message', (event: MessageEvent<string>) => {
    const compressedData: string = event.data;
    const decompressedData: ArticleType[] = decompress(compressedData);
    const sortedByFeed: Record<string, ArticleType[]> =
        decompressedData.reduce((acc: Record<string, ArticleType[]>, article: ArticleType) => {
            (acc[article.feedId] = acc[article.feedId] || []).push(article);
            return acc;
        }, {});

    const compressedBatches: Record<string, string> = {};
    for (const feedId in sortedByFeed) {
        compressedBatches[feedId] = compress(sortedByFeed[feedId]);
    }

    self.postMessage({ decompressedData, compressedBatches });
});