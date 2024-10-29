import { get } from 'svelte/store';
import {
    addAll,
    addBoth,
    addNewLinks,
    addNewNodes,
    redrawLinks,
    removeNodesById,
} from '../../components/graph/SigmaGraphUpdate';
import {
    embeddingsStore,
    selectedFeedsStore,
    pairsStore,
    nodesStore,
    linksStore,
    selectedArticleIds,
    articleIdsStore,
    linksPercentile,
} from '../stores/stores';
import type {
    ArticleType as Article,
    EmbeddingsState,
    SelectedFeedsState,
    PairsState,
    NodeUpdate,
    LinkUpdate,
    Link,
} from '$lib/types';
import { quickSelect } from '../../components/graph/graph';
import queueArticlesToNodes from './articlesToNodes';
import queueNewArticles from '$lib/updates/embedFetch';
import calculateAllPairs from '$lib/updates/pairCalculator';
import queueNodesToLinks from './nodesToLinks';

let threshold: number;

function getThresholdFromLinks(links: Link[], percentile: number): number {
    if (percentile === 1) return 1;
    const selectedWeights = links.map(link => link.weight);
    const thresholdIndex = Math.floor(selectedWeights.length * percentile);
    return selectedWeights.length > 1 ? quickSelect(selectedWeights, thresholdIndex + 1) : threshold;
}

function filterLinks(percentile: number, links: Link[], selectedArticleIdsSet: Set<string>): Link[] {
    const selectedLinks = links.filter(link =>
        selectedArticleIdsSet.has(link.source) && selectedArticleIdsSet.has(link.target));
    threshold = getThresholdFromLinks(selectedLinks, percentile);
    return selectedLinks.filter(link => link.weight > threshold);
}

linksPercentile.subscribe(percentile => {
    const selectedArticleIdsSet = get(selectedArticleIds);
    if (selectedArticleIdsSet.size > 0)
        redrawLinks(filterLinks(
            percentile,
            get(linksStore).links,
            selectedArticleIdsSet
        ));
});

embeddingsStore.subscribe(($embeddingsStore: EmbeddingsState) => calculateAllPairs($embeddingsStore));

pairsStore.subscribe(($pairsStore: PairsState) => {
    const nodes = get(nodesStore).nodes.map(node => ({ id: node.id, color: node.color }));
    queueNodesToLinks(nodes, $pairsStore.newPairs);
});

nodesStore.subscribe(($nodesStore: NodeUpdate) => {
    const selectedArticleIdsSet = get(selectedArticleIds);
    if (selectedArticleIdsSet.size > 0)
        addNewNodes($nodesStore.newNodes.filter(node => selectedArticleIdsSet.has(node.id)));
});

linksStore.subscribe(($linksStore: LinkUpdate) => {
    const percentile = get(linksPercentile);
    if (percentile === 1) return;
    const selectedArticleIdsSet = get(selectedArticleIds);
    const newLinks = filterLinks(percentile, $linksStore.newLinks, selectedArticleIdsSet);
    if (newLinks.length > 0) addNewLinks(newLinks);
});

selectedFeedsStore.subscribe(($selectedFeedsStore: SelectedFeedsState) => {
    if (!$selectedFeedsStore.change) return;
    if ($selectedFeedsStore.change.type === 'new') {
        queueNewArticles($selectedFeedsStore.change.articles as Article[]);
        queueArticlesToNodes(($selectedFeedsStore.change.articles as Article[])
            .map(({ id, feedColor, title, date }) => ({ id, feedColor, title, date })));
        return;
    }

    const nodes = get(nodesStore).nodes;
    const articleIdsForFeed = get(articleIdsStore)[$selectedFeedsStore.change.feedId];
    const selectedLinks = getSelectedLinks();
    switch ($selectedFeedsStore.change.type) {
        case 'add':
            addBoth({
                nodes: nodes.filter(node => articleIdsForFeed.has(node.id)),
                links: selectedLinks
            });
            break;
        case 'remove':
            removeNodesById(articleIdsForFeed, selectedLinks);
            break;
        case 'all':
            addAll({
                nodes: nodes.filter(node => $selectedFeedsStore.change?.articles
                    && ($selectedFeedsStore.change.articles as Set<string>).has(node.id)),
                links: selectedLinks
            });
            break;
    }
});

export function getSelectedLinks(): Link[] {
    const selectedArticleIdsSet = get(selectedArticleIds);
    const links = get(linksStore).links;
    return filterLinks(get(linksPercentile), links, selectedArticleIdsSet);
}