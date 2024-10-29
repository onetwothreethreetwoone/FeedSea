import { get } from 'svelte/store';
import queueArticlesToNodes from './articlesToNodes';
import queueNewArticles from '$lib/updates/embedFetch';
import calculateAllPairs from '$lib/updates/pairCalculator';
import queueNodesToLinks from './nodesToLinks';
import {
    addAll,
    addBoth,
    addNewLinks,
    addNewNodes,
    clearGraph,
    redrawLinks,
    removeNodesById,
} from '../../components/graph/ThreeGraphUpdate';
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
import type {
    GraphOperation,
    OperationData
} from '$lib/graphTypes';
import { quickSelect } from '../../components/graph/graph';

let threshold: number;

linksPercentile.subscribe(percentile => {
    const selectedArticleIdsSet = get(selectedArticleIds);
    if (selectedArticleIdsSet.size === 0) return;
    const selectedLinks = get(linksStore).links.filter(link =>
        selectedArticleIdsSet.has(link.source)
        && selectedArticleIdsSet.has(link.target))
    threshold = getThresholdFromLinks(selectedLinks, percentile);
    redrawLinks(selectedLinks.filter(link => link.weight > threshold));
})



function queueAddBoth(data: OperationData) {
    const selectedArticleIdsSet = get(selectedArticleIds);
    const latestArticleIdsSet = get(articleIdsStore)[data.newFeedId];
    const selectedLinks = get(linksStore).links.filter(link =>
        selectedArticleIdsSet.has(link.source)
        && selectedArticleIdsSet.has(link.target))
    threshold = getThresholdFromLinks(selectedLinks, get(linksPercentile));
    addBoth({
        nodes: get(nodesStore).nodes.filter(node => latestArticleIdsSet.has(node.id)),
        links: selectedLinks.filter(link => link.weight > threshold &&
            (latestArticleIdsSet.has(link.source) || latestArticleIdsSet.has(link.target)))
    });
}

function queueRemoveSelectedNodes(data: OperationData) {
    removeNodesById(
        get(articleIdsStore)[data.newFeedId],
        getSelectedLinks()
    );
}

export function getSelectedLinks(): Link[] {
    const selectedArticleIdsSet = get(selectedArticleIds);
    const selectedLinks = get(linksStore).links.filter(link =>
        selectedArticleIdsSet.has(link.source)
        && selectedArticleIdsSet.has(link.target))
    threshold = getThresholdFromLinks(selectedLinks, get(linksPercentile));
    return selectedLinks.filter(link => link.weight > threshold);
}


function queueAllSelectedNodes(data: { articles: Set<string> }) {
    const links = get(linksStore).links;
    threshold = getThresholdFromLinks(links, get(linksPercentile));
    addAll({
        nodes: get(nodesStore).nodes.filter(node =>
            (data.articles as Set<string>).has(node.id)),
        links: links.filter(link => link.weight > threshold)
    });
}

function getThresholdFromLinks(links: Link[], percentile: number) {
    if (percentile === 1) return 1;
    const selectedWeights = links.map(link => link.weight);
    const thresholdIndex = Math.floor(selectedWeights.length * percentile);
    return selectedWeights.length > 1
        ? quickSelect(selectedWeights, thresholdIndex + 1)
        : threshold;
}

async function queueAddNewLinks(data: LinkUpdate) {
    const percentile = get(linksPercentile);
    if (percentile === 1) return;

    const selectedArticleIdsSet = get(selectedArticleIds);
    const selectedLinks = data.links.filter(link =>
        selectedArticleIdsSet.has(link.source)
        && selectedArticleIdsSet.has(link.target))

    const threshold = getThresholdFromLinks(selectedLinks, percentile);

    const newLinks = data.newLinks.filter(link =>
        link.weight > threshold
        && selectedArticleIdsSet.has(link.source)
        && selectedArticleIdsSet.has(link.target))
    if (newLinks.length > 0) addNewLinks(newLinks);
}

function queueAddNewNodes(data: NodeUpdate) {
    const selectedArticleIdsSet = get(selectedArticleIds);
    const newNodes = data.newNodes.filter(node => selectedArticleIdsSet.has(node.id))
    if (newNodes.length > 0) addNewNodes(newNodes);
}

function queueClear() {
    clearGraph();
}

async function enqueueGraphOperation(task: GraphOperation) {
    switch (task.type) {
        case 'clearGraph':
            queueClear();
            break;
        case 'addNodes':
            queueAddNewNodes(task.data as NodeUpdate);
            break;
        case 'addLinks':
            queueAddNewLinks(task.data as LinkUpdate);
            break;
        case 'removeNodes':
            queueRemoveSelectedNodes(task.data as OperationData);
            break;
        case 'addBoth':
            queueAddBoth(task.data as OperationData);
            break;
        case 'addAll':
            queueAllSelectedNodes(task.data as { articles: Set<string> });
            break;
        default:
            console.error('Unsupported operation');
    }
}


embeddingsStore.subscribe(($embeddingsStore: EmbeddingsState) =>
    calculateAllPairs($embeddingsStore));

pairsStore.subscribe(($pairsStore: PairsState) =>
    queueNodesToLinks(
        get(nodesStore).nodes.map(
            node => ({
                id: node.id,
                color: node.color
            })
        ),
        $pairsStore.newPairs)
);

nodesStore.subscribe(($nodesStore: NodeUpdate) =>
    enqueueGraphOperation({
        type: 'addNodes',
        data: $nodesStore
    })
);

linksStore.subscribe(($linksStore: LinkUpdate) =>
    enqueueGraphOperation({
        type: 'addLinks',
        data: $linksStore
    })
);


selectedFeedsStore.subscribe(($selectedFeedsStore: SelectedFeedsState) => {
    if (!$selectedFeedsStore.change) return;
    if ($selectedFeedsStore.change.type === 'new')
        return newArticlesToNodes(
            $selectedFeedsStore.change.articles as Article[]
        );

    switch ($selectedFeedsStore.change.type) {
        case 'add':
            enqueueGraphOperation({
                type: 'addBoth',
                data: {
                    feedIds: $selectedFeedsStore.feedIds,
                    newFeedId: $selectedFeedsStore.change.feedId
                }
            });
            break;
        case 'remove':
            enqueueGraphOperation({
                type: 'removeNodes',
                data: {
                    feedIds: $selectedFeedsStore.feedIds,
                    newFeedId: $selectedFeedsStore.change.feedId
                }
            });
            break;
        case 'all':
            enqueueGraphOperation({
                type: 'addAll',
                data: {
                    articles: $selectedFeedsStore.change.articles as Set<string>
                }
            });
            break;
    }

});

function newArticlesToNodes(articles: Article[] | undefined) {
    if (!articles) return;
    queueNewArticles(articles);
    queueArticlesToNodes(
        articles.map(
            ({ id, feedColor, title, date }) => ({ id, feedColor, title, date })
        )
    );
}
