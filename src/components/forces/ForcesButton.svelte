<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	function handleForces() {
		dispatch('toggleForcePanel');
	}
</script>

<button on:click={handleForces} class="forces-button">Forces</button>

<style>
	.forces-button {
		color: #fff;
		padding: 3px 8px;
		margin-top: -1px;
		margin-right: 1px;
		background-color: #9156f0;
		font-size: 0.9em;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.3s ease;
		outline: none; /* Removes the default focus outline */
	}

	.forces-button:hover {
		background-color: #a06ef2; /* Slightly lighter purple on hover */
	}

	.forces-button:focus {
		box-shadow: none
	}
</style>
