<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { get } from 'svelte/store';
	import {
		feedsStore,
		articlesStore,
		selectedFeeds,
		selectedFeedIds,
		selectedFeedsStore,
		focusedArticleId,
		selectedArticleIds,
		articleIdsStore
	} from '$lib/stores/stores';
	import { fetchFeeds, selectFeed } from '$lib/api';
	import { startSSE, stopSSE } from '$lib/SSEService';
	import ArticlesPanel from '../articles/ArticlesPanel.svelte';
	import { isLoadingFeeds, isLoadingArticles } from '$lib/stores/loadingState';

	import type {
		FeedChange,
		FeedWithUnreadStories,
		ArticleType as Article,
		SelectedFeedsState
	} from '$lib/types';
	import { theme } from '$lib/stores/night';

	import '$lib/updates/updates';
	import axios from 'axios';
	import { clearGraph } from '../graph/SigmaGraphUpdate';

	let feeds: FeedWithUnreadStories[] = [];
	// let selectedFeeds: FeedWithUnreadStories[] = []; // Track selected feeds
	let latestSelectedFeed: FeedWithUnreadStories | null = null;

	const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

	const unsubscribeFeeds = feedsStore.subscribe((value) => {
		feeds = Object.values(value);
		isLoadingFeeds.set(false);
	});

	function handleBeforeUnload() {
		unsubscribeFeeds();
		stopSSE();
		window.removeEventListener('beforeunload', handleBeforeUnload);
	}

	async function checkAndKeepAlive() {
		const feeds = get(feedsStore);
		const articlesCacheKeys = new Set(Object.keys(get(articleIdsStore)));
		const allFeedsCached = Object.keys(feeds).every((feedId) => articlesCacheKeys.has(feedId));
		//if (!allFeedsCached) {
		axios.get('/keep-alive', { withCredentials: true });
		//}
	}
	onMount(() => {
		(async () => {
			isLoadingFeeds.set(true);
			await fetchFeeds();
			isLoadingFeeds.set(false);
			startSSE();
			window.addEventListener('beforeunload', handleBeforeUnload);

			const keepAliveInterval = setInterval(checkAndKeepAlive, PING_INTERVAL);

			return () => {
				clearInterval(keepAliveInterval);
			};
		})();
	});

	onDestroy(() => {
		unsubscribe(); // Clean up the subscription
		isLoadingArticles.set(false); // Ensure loading state is reset when component is destroyed
		handleBeforeUnload();
	});

	let unsubscribe = focusedArticleId.subscribe((id) => {
		if (id) {
			pointArticleFromNode(id);
		}
	});

	async function pointArticleFromNode(nodeId: string) {
		const foundEntry = Object.entries(get(articleIdsStore)).find(([_, articleIds]) =>
			articleIds.has(nodeId)
		);
		if (foundEntry) {
			const [foundFeedId] = foundEntry;
			latestSelectedFeed = get(feedsStore)[foundFeedId];
			await tick(); // Wait for the DOM to update after displaying the feed
			scrollToArticle(nodeId);
		}
	}

	function scrollToArticle(nodeId: string) {
		const articleElement = document.querySelector(`[data-article-id="${nodeId}"] .article-title`);
		if (articleElement) {
			articleElement.scrollIntoView({ behavior: 'auto', block: 'start' });
		}
	}

	async function handleFeedClick(feed: FeedWithUnreadStories) {
		selectedFeedsStore.update(({ feedIds }) => {
			const updatedFeedIds = feedIds;
			let updatedChange: FeedChange;

			if (!feedIds.has(feed.id)) {
				// Feed is being selected
				if (!Object.keys(get(articleIdsStore)).includes(feed.id.toString())) {
					articlesStore.update((articles) => {
						articles[feed.id] = [];
						return articles;
					});
					articleIdsStore.update((articles) => {
						articles[feed.id] = new Set();
						return articles;
					});
					selectFeed(feed);
				}
				updatedFeedIds.add(feed.id);
				updatedChange = { type: 'add', feedId: feed.id, articles: [] };
				latestSelectedFeed = feed;
				selectedFeeds.update((selectedFeeds) => [...selectedFeeds, feed]);
				selectedFeedIds.update((feedIds) => {
					feedIds.add(feed.id.toString());
					return feedIds;
				});
				selectedArticleIds.update((articleIds) => {
					const articles = get(articleIdsStore)[feed.id];
					articles.forEach((article) => articleIds.add(article));
					return articleIds;
				});
			} else {
				// Feed is being deselected
				updatedFeedIds.delete(feed.id);
				updatedChange = { type: 'remove', feedId: feed.id };
				if (latestSelectedFeed && latestSelectedFeed.id === feed.id) {
					latestSelectedFeed = null;
				}
				selectedFeeds.update((selectedFeeds) => selectedFeeds.filter((f) => f.id !== feed.id));
				selectedFeedIds.update((feedIds) => {
					feedIds.delete(feed.id.toString());
					return feedIds;
				});
				selectedArticleIds.update((articleIds) => {
					const articles = get(articleIdsStore)[feed.id];
					articles.forEach((article) => articleIds.delete(article));
					return articleIds;
				});
			}

			return { feedIds: updatedFeedIds, change: updatedChange };
		});
	}

	let selectAll = true; // True means "Select All" is shown, false for "Unselect All"

	function toggleSelectAll() {
		latestSelectedFeed = null;
		if (selectAll) selectAllFeeds();
		else unselectAllFeeds();
		selectAll = !selectAll;
	}

	function selectAllFeeds() {
		const fullFeedStore = get(feedsStore);
		const cachedFeeds = Object.keys(get(articleIdsStore));
		const allFeedIds = Object.keys(fullFeedStore).map((id) => parseInt(id));
		const allFeeds = Object.values(fullFeedStore);
		const feedsToSelect = allFeeds.filter((feed) => !cachedFeeds.includes(feed.id.toString()));

		articlesStore.update((articles) => {
			feedsToSelect.forEach((feed) => {
				articles[feed.id] = [];
			});
			return articles;
		});
		articleIdsStore.update((articles) => {
			const allArticleIds = new Set<string>();
			for (const articleSet of Object.values(articles))
				for (const articleId of articleSet) allArticleIds.add(articleId);

			selectedArticleIds.set(allArticleIds);
			for (const feed of feedsToSelect) articles[feed.id] = new Set();

			return articles;
		});

		selectedFeedIds.set(new Set(Object.keys(fullFeedStore)));

		feedsToSelect.forEach((feedId) => selectFeed(feedId));

		const articleIds = get(articleIdsStore);
		selectedFeedsStore.update(({ feedIds }) => {
			const unselectedArticleIds = new Set<string>();
			for (const feedId of Object.keys(articleIds))
				if (!feedIds.has(parseInt(feedId)))
					for (const articleId of articleIds[feedId]) unselectedArticleIds.add(articleId);

			return {
				feedIds: new Set(allFeedIds),
				change: {
					type: 'all',
					feedId: -1,
					articles: unselectedArticleIds
				}
			};
		});
		selectedFeeds.set(allFeeds);
	}

	function unselectAllFeeds() {
		selectedFeedsStore.update(() => ({ feedIds: new Set() }));
		selectedFeeds.set([]);
		selectedArticleIds.set(new Set());
		selectedFeedIds.set(new Set());
		clearGraph();
	}
</script>

<div class="feeds-wrapper">
	<div class="feeds-container {$isLoadingFeeds ? 'loading' : ''}" class:dark={$theme === 'dark'}>
		{#if $isLoadingFeeds}
			<h1>Feeds</h1>
			<div class="spinner" aria-label="Loading feeds"></div>
		{:else}
			<button
				class="feed-item"
				on:click={toggleSelectAll}
				style="color: #fff; padding: 9px 20px; margin-top: 7px; background-color: #9156f0;"
			>
				<div class="feed-item-content">{selectAll ? 'Select All' : 'Unselect All'}</div>
			</button>

			{#each feeds as feed}
				<button
					class="feed-item"
					class:selected={$selectedFeedIds.has(feed.id.toString())}
					on:click={() => handleFeedClick(feed)}
					style="background-color: {feed.color};"
				>
					<div class="feed-item-content">{feed.feed_title}</div>
					<div class="unread-count">{feed.nt}</div>
				</button>
			{/each}
		{/if}
	</div>
</div>

{#if latestSelectedFeed}
	{#if $isLoadingArticles}
		<div class="spinner" aria-label="Loading articles"></div>
	{:else}
		<ArticlesPanel {latestSelectedFeed} />
	{/if}
{/if}

<style>
	.dark h1 {
		color: white;
	}

	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #09f;
		animation: spin 1s linear infinite;
		/* margin: auto; */
		margin-left: 10px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.feed-item {
		width: 250px; /* Fixed width */
		text-align: left;
		transition:
			background-color 0.3s ease,
			box-shadow 0.3s ease;
		padding: 10px 15px;
		font-family: 'Roboto', sans-serif;
		font-size: 16px;
		color: #333;
		border: none;
		background-color: #fff;
		border-radius: 5px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		position: relative;
		overflow: hidden;
		margin-bottom: 5px; /* Space between items */
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.feed-item.selected {
		transform: translateX(-2px); /* Retract the button 2px to the left */
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease; /* Smooth transition for the transform and shadow */
	}

	.feed-item.selected::after {
		content: '';
		position: absolute;
		top: -1px; /* Adjust these values to match the border size */
		left: -1px;
		right: -1px;
		bottom: -1px;
		z-index: -1;
		/* background: linear-gradient(to right, rgba(208, 208, 208, 0.5), rgba(208, 208, 208, 0.5)); */
		border-radius: 3px; /* Match the border-radius of .feed-item if any */
	}

	.feed-item::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: radial-gradient(circle at left, rgba(255, 255, 255, 0.5), transparent);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.5s ease-in-out;
		z-index: 1; /* Adjusted to ensure visibility */
	}

	.feed-item:hover::after {
		opacity: 1; /* Show the hover effect */
	}

	.feed-item-content {
		z-index: 2; /* Ensure text is above the hover effect */
		position: relative; /* Required for z-index to take effect */
	}

	.unread-count {
		background-color: #817f7f6b; /* Example: red background for visibility */
		color: white;
		padding: 2px 5px;
		border-radius: 10px; /* Rounded corners for the unread count */
		font-size: 0.8em; /* Smaller font size for the count */
		margin-left: 10px; /* Space between the title and the count */
		z-index: 1; /* Ensure it's above the hover effect */
		position: relative; /* Required for z-index to take effect */
	}

	.feed-item:focus {
		outline: none;
		/* box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.5); */
	}

	.feeds-wrapper {
		display: inline-block; /* Or width: fit-content; */
		max-height: 100vh;
		overflow: hidden; /* Prevents the wrapper from expanding beyond the width of its content */
	}

	.feeds-container {
		overflow-y: auto;
		overflow-x: hidden; /* Prevent horizontal scrolling */
		max-height: 100vh;
	}

	.feeds-container.loading {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.feeds-container::-webkit-scrollbar {
		width: 4px; /* Make the scrollbar thinner */
	}

	.feeds-container::-webkit-scrollbar-track {
		background: transparent; /* Make the track transparent */
	}

	.feeds-container::-webkit-scrollbar-thumb {
		background: transparent; /* Make the thumb transparent by default */
	}

	.feeds-container:hover::-webkit-scrollbar-thumb {
		background: rgba(136, 136, 136, 0.5); /* Show the thumb on hover with transparency */
	}

	.feeds-container::-webkit-scrollbar-thumb:hover {
		background: rgba(85, 85, 85, 0.5); /* Darker color on thumb hover */
	}
</style>
