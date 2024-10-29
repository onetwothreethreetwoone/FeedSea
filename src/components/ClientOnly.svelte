<script lang="ts">
	import { onMount } from 'svelte';
	let Component: typeof import('../components/TransitionComponent.svelte').default;

	onMount(async () => {
		const module = await import('../components/TransitionComponent.svelte');
		Component = module.default;
	});
</script>

<svelte:component this={Component} />
