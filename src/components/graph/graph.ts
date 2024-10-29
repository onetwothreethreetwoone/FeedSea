import { getColorFromString } from '$lib/colors';
import chroma from 'chroma-js';
import type { Node, Link, Pair } from '$lib/types';

const DEFAULT_BATCHISIZE = 1;

function articlesToNodes(
    articles: { id: string, feedColor: string, title: string, date: string }[]
): Node[] {
    const center = { x: 0, y: 0 };
    const radius = 0.01;
    const maxBrightnessIncrease = 0.5 ;

    return articles.map((article) => {
        const hoursSincePublished = Math
            .abs(new Date().getTime()
                - new Date(article.date).getTime())
            / (1000 * 60 * 60);
        let color = getColorFromString(article.feedColor);

        if (hoursSincePublished <= 48)
            color = chroma(color)
                .brighten((1 - (hoursSincePublished / 48)) * maxBrightnessIncrease).hex();

        return {
            id: article.id,
            title: article.title,
            color: color,
            x: center.x + Math.random() * radius * Math.cos(Math.random() * Math.PI * 2),
            y: center.y + Math.random() * radius * Math.sin(Math.random() * Math.PI * 2),
            size: 10,
        };
    });
}
export function quickSelect(arr: number[], k: number): number {
    // Partition the array around a pivot
    const pivot = arr[Math.floor(Math.random() *  arr.length)];
    const lower: number[] = [];
    const higher: number[] = [];
    arr.forEach((num) => {
        if (num < pivot)
            lower.push(num);
        else if (num > pivot)
            higher.push(num);
    });
    if (k <= lower.length)
        return quickSelect(lower, k);
    if (k > arr.length - higher.length)
        return quickSelect(higher, k - (arr.length - higher.length));
    return pivot;
}

export function filterLinksByPercentile(links: Record<string, Pair>, percentile = 0.95): Record<string, Pair> {
    if (percentile < 0 || percentile > 1)
        throw new Error('Percentile must be between 0 and 1');

    let similarities: number[] | null =
        Object.values(links).map(link => link.similarity);

    const thresholdIndex = Math.floor(similarities.length * percentile);
    const threshold = quickSelect(similarities, thresholdIndex + 1);
    similarities = null;

    return Object.fromEntries(
        Object.entries(links).filter(([, link]) => link.similarity >= threshold)
    );
}

function* nodesToLinksGenerator(
    nodes: Array<{ id: string; color: string }>,
    pairsStore: Record<string, Pair>,
    batchSize: number = DEFAULT_BATCHISIZE
): Generator<Link[]> {
    if (Object.keys(pairsStore).length > 0) {
        let links: Link[] = [];
        const nodeColorMap = new Map(nodes.map(node => [node.id, node.color]));
        const colorMixesMap = new Map<string, { day: string; night: string }>();

        for (const color1 of nodeColorMap.values()) {
            for (const color2 of nodeColorMap.values()) {
                const key = [color1, color2].sort().join('_');
                if (!colorMixesMap.has(key)) {
                    const mix = chroma.mix(color1, color2, 0.5, 'rgb');
                    const day = mix.brighten(0.27).hex();
                    const night = mix.darken(0.77).hex();
                    colorMixesMap.set(key, { day, night });
                }
            }
        }

        //const filteredPairsStore = filterLinksByPercentile(pairsStore);
        for (const [pairKey, pair] of Object.entries(pairsStore)) {
            const [sourceId, targetId] = pairKey.split('+');
            const sourceColor = nodeColorMap.get(sourceId);
            const targetColor = nodeColorMap.get(targetId);

            if (sourceColor && targetColor) {
                const { day, night } = colorMixesMap
                    .get([sourceColor, targetColor].sort()
                        .join('_')) as { day: string; night: string };

                links.push({
                    source: sourceId,
                    target: targetId,
                    weight: pair.similarity,
                    color: day,
                    day_color: day,
                    night_color: night
                });
            }
            if (links.length >= batchSize) {
                yield links;
                links = [];
            }
        }

        if (links.length > 0) {
            yield links;
        }
    }
    else yield [];

}

async function processLinks(nodes: Node[], pairsStore: Record<string, Pair>): Promise<Link[]> {
    let linkGenerator: Generator<Link[]> | null = nodesToLinksGenerator(nodes, pairsStore);
    const allLinks: Link[] = [];
    for (const linksBatch of linkGenerator)
        for (const link of linksBatch)
            allLinks.push(link);
    linkGenerator = null;
    return allLinks;
}

export {
    articlesToNodes,
    processLinks
}
