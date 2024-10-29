<script lang="ts">
	import Icon from '@iconify/svelte';
	import { isNightMode } from '../../lib/stores/night';
	import { theme, applyTheme } from '../../lib/stores/night';

	const cloudList = ['gridicons:cloud', 'oi:cloud', 'foundation:cloud', 'ion:cloud'];

	let cloud: string;
	$: if (isNightMode) {
		cloud = cloudList[Math.floor(Math.random() * cloudList.length)];
	}

	function toggleTheme() {
		isNightMode.update((v) => !v);
		const themeString = $isNightMode ? 'dark' : 'light'; 
		theme.set(themeString);
		cloud = cloudList[Math.floor(Math.random() * cloudList.length)];
		applyTheme();
	}
</script>

<div id="daynighttoggle">
	<input
		id="change"
		type="checkbox"
		bind:checked={$isNightMode}
		on:click={toggleTheme}
		aria-label="Toggle Day/Night Mode"
	/>
	<label for="change" class="tg">
		<span class="sm">
			<Icon style="color: white" icon={cloud} />
		</span>
	</label>
</div>

<style>
	#daynighttoggle {
		position: relative;
		width: 50px;
		height: 25px;
	}

	input[type='checkbox'] {
		display: none;
	}

	.tg {
		border-radius: 15px;
		background-color: #8bb1fc; /* Day mode color */
		width: 50px;
		height: 25px;
		transition: all 400ms ease;
	}

	.sm {
		display: inline-block;
		position: relative;
		z-index: 1;
		background-color: #fffeba; /* Knob color */
		width: 23px;
		height: 23px;
		border-radius: 50%;
		top: 1px;
		left: 1px;
		transition: all 400ms;
	}

	#change:checked + .tg {
		background-color: #301b8b; /* Night mode color */
	}

	#change:checked + .tg .sm {
		background-color: #d1d1d1; /* Knob color in night mode */
		transform: translateX(25px);
	}
</style>
