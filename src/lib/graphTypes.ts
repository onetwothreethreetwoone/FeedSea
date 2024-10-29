import type {
    ArticleType as Article,
    Node,
    Link,
    GraphData,
    NodeUpdate,
    LinkUpdate
} from '$lib/types';


interface OperationData {
    feedIds: Set<number>
    newFeedId: number
}

interface AllSelectedOperationData {
    articles: Article[] | Set<string>
}

interface AddLinkOperationData {
    newLinks: Link[]
    feedIds: Set<number>
    articles: Record<string, Article[]>
}

interface AddNodesOperationData {
    newNodes: Node[]
    feedIds: Set<number>
    articles: Record<string, Article[]>
}


interface isNightModeData {
    isNightMode: boolean
}
interface GraphOperation {
    type:
    'addNodes'
    | 'addLinks'
    | 'addBoth'
    | 'addAll'
    | 'removeNodes'
    | 'clearGraph'
    | 'themeChange';
    data?:
    isNightModeData
    | NodeUpdate | LinkUpdate | GraphData
    | OperationData
    | AllSelectedOperationData
    | AddLinkOperationData
    | AddNodesOperationData;
}

export type {
    GraphOperation,
    OperationData,
    AllSelectedOperationData,
    AddLinkOperationData,
    AddNodesOperationData
}
