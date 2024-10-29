<script>
	import { onMount, onDestroy } from 'svelte';
	import isLoggedIn from '../lib/stores/auth';
	import { callServerCleanUp } from '$lib/api';
	import Feeds from './feeds/Feeds.svelte';
	import Graph from './graph/Graph.svelte';
	import { theme } from '../lib/stores/night'; // Import the theme store

    async function cleanup() {
        await callServerCleanUp();
    }

    onMount(() => {
        window.addEventListener('beforeunload', cleanup);
    });

    onDestroy(() => {
        cleanup();
        window.removeEventListener('beforeunload', cleanup);
    });

	// Reactive statement to watch the isLoggedIn store
	$: mainWrapperClass = $isLoggedIn ? 'slide-in' : '';

	$: {
		const themeValue = $theme;
		document.documentElement.setAttribute('data-theme', themeValue);
	}
</script>

<div class="main-wrapper {mainWrapperClass}">
	<Feeds />
	<Graph />
</div>

<style>
	:root {
		--background-color-light: #ffffff;
		--background-color-dark: #000000;
	}

	:global([data-theme='light']) {
		--background-color: var(--background-color-light);
	}

	:global([data-theme='dark']) {
		--background-color: var(--background-color-dark);
	}

	:global(body),
	:global(.main-wrapper) {
		background-color: var(--background-color);
		transition: background-color 0.125s ease-in-out;
	}

	.main-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transform: translateX(100%);
		transition: transform  0.5s ease-in-out, background-color  0.125s ease-in-out;
	}

	.slide-in {
		animation: slideIn 0.5s forwards;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}

	/* ... other styles ... */
</style>
