<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { theme } from '$lib/stores/night';
	import { isLoadingArticles } from '$lib/stores/loadingState';
	import { compress, decompress } from '$lib/compression';
	import { articleIdsStore, articlesStore } from '$lib/stores/stores';

	import type {
		FeedWithUnreadStories,
		ArticleType as Article,
		ArticleType,
		CompressedBatchesStoreType
	} from '$lib/types';

	import DayNightModeButton from '../daynight/DayNightModeButton.svelte';
	import ForcesButton from '../forces/ForcesButton.svelte';
	import ForcePanel from '../forces/ForcePanel.svelte';

	let showForcePanel = false;

	function toggleForcePanel() {
		showForcePanel = !showForcePanel;
	}
	export let latestSelectedFeed: FeedWithUnreadStories;

	let articles: Article[] = [];
	let isVisible: boolean = false;
	let startX: number, startWidth: number;

	// When selectedFeed changes, automatically show the panel
	$: if (latestSelectedFeed) {
		isVisible = true;
	}

	function getArticles() {
		articlesStore.update((current) => {
			const currentFeed = current[latestSelectedFeed.id];
			const compressedBatches = currentFeed.splice(0, currentFeed.length);
			articles = [];
			for (const batch of compressedBatches) articles = articles.concat(decompress(batch));
			(current[latestSelectedFeed.id] ||= []).unshift(compress(articles))
			return current;
		});
	}

	$: $articleIdsStore[latestSelectedFeed?.id] ? getArticles() : articles = [];

	$: if (articles.length > 0) isLoadingArticles.set(false);

	function initDrag(e: MouseEvent) {
		startX = e.clientX;
		const htmlElement = document.querySelector('.articles-panel-wrapper') as HTMLElement;
		startWidth = htmlElement.offsetWidth;
		document.documentElement.addEventListener('mousemove', doDrag, false);
		document.documentElement.addEventListener('mouseup', stopDrag, false);

		// Disable text selection during drag
		document.body.style.userSelect = 'none';
	}

	function doDrag(e: MouseEvent) {
		const newWidth = startWidth + (startX - e.clientX);
		const htmlElement = document.querySelector('.articles-panel-wrapper') as HTMLElement;
		htmlElement.style.width = `${newWidth}px`;
	}

	function stopDrag() {
		document.documentElement.removeEventListener('mousemove', doDrag, false);
		document.documentElement.removeEventListener('mouseup', stopDrag, false);

		// Re-enable text selection after drag
		document.body.style.userSelect = '';
	}

	onMount(() => {
		const articleTextContainers = document.querySelectorAll('.article-text');
		articleTextContainers.forEach((container) => {
			const images = container.querySelectorAll('img');
			images.forEach((img) => {
				img.addEventListener('error', () => {
					img.remove(); // Remove the image if it fails to load
				});
			});
		});
	});

	onDestroy(() => {
		isLoadingArticles.set(false); // Ensure loading state is reset when component is destroyed
	});

	function formatDate(dateString: string | undefined): string {
		if (!dateString) {
			return 'No date provided';
		}
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		};
		// Use the user's locale and formatting preferences
		return new Intl.DateTimeFormat(undefined, options).format(date);
	}
</script>

{#if $isLoadingArticles}
	<div class="spinner" aria-label="Loading articles"></div>
{:else}
	<div class:dark={$theme === 'dark'} class="articles-panel-wrapper" class:visible={isVisible}>
		<div class="resizer" on:mousedown={initDrag} role="button" tabindex="0"></div>
		<div class="buttons-container">
			<DayNightModeButton />
			<ForcesButton on:toggleForcePanel={toggleForcePanel} />
		</div>
		{#if showForcePanel}
			<ForcePanel />
		{:else if latestSelectedFeed}
			<h3>{latestSelectedFeed.feed_title}</h3>
			{#if articles.length > 0}
				<div class="articles-container">
					<ul>
						{#each articles as article (article.id)}
							<li data-article-id={article.id} style="background-color: {article.feedColor};">
								<h4 class="article-title">{article.title}</h4>
								<time class="article-date" datetime={article.date}>{formatDate(article.date)}</time>
								<div><a href={article.url} target="_blank">{article.url}</a></div>
								<!-- Render the article text as HTML -->
								<div class="article-text">
									{@html article.text}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<p>Loading...</p>
			{/if}
		{:else}
			<p>Please select a feed to view articles.</p>
		{/if}
	</div>
{/if}

<style>
	.articles-panel-wrapper {
		width: calc(100vw / 4);
		position: fixed;
		overflow-y: hidden;
		top: 0;
		right: 0;
		height: 100vh;
		background-color: white;
		padding: 0.4rem;
		box-shadow: -1px 0 2px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease-in-out;
		transform: translateX(100%); /* Initially hidden */
		display: flex;
		flex-direction: column;
	}
	.articles-panel-wrapper.visible {
		transform: translateX(0); /* Make visible */
	}
	.spinner {
		border: 4px solid rgba(0, 0, 0, 0.1);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border-left-color: #09f;
		animation: spin 1s linear infinite;
		margin: auto;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.resizer {
		width: 14px;
		height: 100%;
		background: #ffffff00;
		cursor: ew-resize;
		position: absolute;
		left: -7px;
		top: 0;
	}

	.buttons-container {
		display: flex;
		justify-content: flex-end;
		position: absolute;
		top: 10px;
		right: 10px;
	}

	.buttons-container :global(button) {
		margin-left: 10px; /* Adds margin to the left of each button */
		flex: 0 0 auto; /* Prevents the buttons from growing or shrinking */
	}

	.buttons-container :global(button:first-child) {
		margin-left: 0; /* Removes left margin from the first button */
	}

	/* Dark mode styles */
	.dark {
		background-color: #222;
		color: #fff; /* Light text color */
		transition:
			background-color 0.1s ease-in-out,
			color 0.1s ease-in-out;
	}

	/* Ensure article content does not change in dark mode */
	.dark li {
		background-color: initial;
		color: initial;
	}

	.dark .resizer {
		background: #1b1a1a;
	}

	ul {
		list-style-type: none; /* Removes the default bullet points */
		padding-left: 0; /* Removes padding */
		margin-left: 10px;
	}
	li {
		margin-bottom: 1rem;
	}
	:global(.articles-panel-wrapper img) {
		max-width: 100%;
		height: auto;
	}

	.articles-container {
		overflow-y: auto;
		flex: 1;
	}

	/* Apply similar scrollbar styles as in Feeds.svelte */
	.articles-container::-webkit-scrollbar {
		width: 4px;
	}

	.articles-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.articles-container::-webkit-scrollbar-thumb {
		background: transparent;
	}

	.articles-container:hover::-webkit-scrollbar-thumb {
		background: rgba(136, 136, 136, 0.5);
	}

	.articles-container::-webkit-scrollbar-thumb:hover {
		background: rgba(85, 85, 85, 0.5);
	}

	.article-date {
		display: block;
		font-weight: bold; /* Make the date bold */
		color: #234; /* Change the color to suit your design */
		margin-bottom: 0.1rem; /* Add some bottom margin for spacing */
	}
</style>
