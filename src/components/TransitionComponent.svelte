<script lang="ts">
	// import { onDestroy } from 'svelte';
	import isLoggedIn from '../lib/stores/auth';
	import LoginForm from '../components/login/LoginForm.svelte';
	import MainComponent from '../components/MainComponent.svelte';
	// import {serverLogger as logger} from '../logger.js';

	let isLoggedInValue: boolean;
	$: isLoggedInValue = $isLoggedIn;

	// const unsubscribe = isLoggedIn.subscribe((value) => {
	// 	logger.log('isLoggedIn changed:', value);
	// });

	// onDestroy(() => {
	// 	unsubscribe();
	// });
</script>

{#if isLoggedInValue}
	<MainComponent />
{:else}
	<LoginForm />
{/if}

<style>
	/* some comment */
</style>
