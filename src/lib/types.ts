import Graph from "graphology";

interface Story {
    story_hash: string;
    story_tags: string[];
    story_date: string;
    story_timestamp: string;
    story_authors: string;
    story_title: string;
    story_permalink: string;
    image_urls: string[];
    secure_image_urls: Record<string, unknown>;
    secure_image_thumbnails: Record<string, unknown>;
    story_feed_id: number;
    has_modifications: boolean;
    comment_count: null | number;
    comment_user_ids: string[];
    share_count: null | number;
    share_user_ids: string[];
    guid_hash: string;
    id: string;
    friend_comments: unknown[];
    friend_shares: unknown[];
    public_comments: unknown[];
    reply_count: number;
    short_parsed_date: string;
    long_parsed_date: string;
    read_status: number;
    intelligence: {
        feed: number;
        author: number;
        tags: number;
        title: number;
    };
    score: number;
}

interface StoryWithColor extends Story {
    color: string;
}




interface FeedInfo {
    id: number;
    feed_title: string;
    feed_address: string;
    feed_link: string;
    num_subscribers: number;
    updated: string;
    updated_seconds_ago: number;
    fs_size_bytes: number;
    archive_count: number;
    last_story_date: string;
    last_story_seconds_ago: number;
    stories_last_month: number;
    average_stories_per_month: number;
    min_to_decay: number;
    subs: number;
    is_push: boolean;
    is_newsletter: boolean;
    fetched_once: boolean;
    search_indexed: boolean;
    not_yet_fetched: boolean;
    favicon_color: string;
    favicon_fade: string;
    favicon_border: string;
    favicon_text_color: string;
    favicon_fetching: boolean;
    favicon_url: string;
    s3_page: boolean;
    s3_icon: boolean;
    disabled_page: boolean;
    ps: number;
    nt: number;
    ng: number;
    active: boolean;
    feed_opens: number;
    subscribed: boolean;
}

interface FeedWithColor extends FeedInfo {
    color: string;
}

interface FeedWithUnreadStories extends FeedWithColor {
    unreadStories: string[];
}


interface Feeds {
    [key: string]: FeedInfo
}

interface FeedsWithColor {
    [key: string]: FeedWithColor;
}

interface FeedsWithUnreadStories {
    [key: string]: FeedWithUnreadStories;
}

type CompressedBatchesStoreType = Record<string, string[]>;


interface ArticleType {
    id: string;
    feedId: string;
    feedColor: string;
    title: string;
    text: string;
    date: string;
    url: string;
}

interface FeedChange {
    type: 'add' | 'remove' | 'new' | 'all';
    feedId: number;
    articles?: ArticleType[] | Set<string>;
}

interface SelectedFeedsState {
    feedIds: Set<number>;
    change?: FeedChange;
}



interface Node {
    id: string;
    title: string;
    color: string;
    x: number;
    y: number;
    size: number;
    // vx: number;
    // vy: number;
    // degree: number;
    // mass: number;
}


interface GraphData {
    nodes: Node[];
    links: Link[];
 }

interface Link {
    source: string;
    target: string;
    weight: number;
    color: string,
    day_color: string,
    night_color: string
}

interface PendingPair {
    id1: string;
    id2: string;

}

interface Pair extends PendingPair {
    similarity: number;
}


interface EmbeddingsCache {
    [key: string]: number[];
 }
 
 
 interface EmbeddingsState {
    embeddings: EmbeddingsCache
    newEmbeddings: EmbeddingsCache
 }
 
 type NodeUpdate = { nodes: Node[], newNodes: Node[] }
 type LinkUpdate = { links: Link[], newLinks: Link[] }
 
 interface PairsState {
    pairs: Record<string, Pair>;
    newPairs: Record<string, Pair>;
 }

 interface GraphState {
    graph: Graph,
    newGraph: Graph
    task: string
    newLinks: Set<string>
 }

export type {
    Story,
    StoryWithColor,
    FeedInfo,
    FeedWithColor,
    FeedWithUnreadStories,
    Feeds,
    FeedsWithColor,
    FeedsWithUnreadStories,
    CompressedBatchesStoreType,
    ArticleType,
    FeedChange,
    SelectedFeedsState,
    Node,
    Link,
    GraphData,
    PendingPair,
    Pair,
    EmbeddingsCache,
    EmbeddingsState,
    NodeUpdate,
    LinkUpdate,
    PairsState,
    GraphState
}
