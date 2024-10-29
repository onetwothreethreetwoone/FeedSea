<script lang="ts">
	import './forceStyles.css';

	import { fly } from 'svelte/transition';
	import { isForceAtlas } from '$lib/stores/forces';
	import { switchLayout } from '../graph/SigmaGraphUpdate';
	import ForceLayoutSettings from './ForceLayoutSettings.svelte';
	import ForceAtlas2Settings from './ForceAtlas2Settings.svelte';
	import Slider from './slider';
	import { linksPercentile } from '$lib/stores/stores';

	const toggleForce = () => {
		switchLayout();
	};
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') toggleForce();
	};
	const flyParams = { x: -100, duration: 500 };

	const savedValue = localStorage.getItem('linksPercentile');
    let savedPercentile = savedValue ? JSON.parse(savedValue) : 0.5;
    let linksPercentileSlider = new Slider<number>(
        'linksPercentile',
        'Links Percentile',
        'Adjusts the percentile of links filtered.',
        savedPercentile, 
		{
            min: 0,
            max: 1,
            precision: 3,
            scaleType: 'linear'
        }
    );

    function updateLinksPercentile() {
        const originalValue = Slider.calculateOriginalValue(linksPercentileSlider.value, linksPercentileSlider.config);
        linksPercentile.set(originalValue);
        localStorage.setItem('linksPercentile', JSON.stringify(originalValue));
    }

	let easterEggActive = Math.random() < 0.1;
</script>

<div class="force-panel">
	<h3>
		<span
			class="force-clickable"
			tabindex="0"
			on:click={toggleForce}
			on:keydown={handleKeydown}
			role="button">Force Atlas</span
		>
		<div class="title-container">
			{#if !$isForceAtlas}
				<span in:fly={flyParams} out:fly={flyParams}>2</span>
			{/if}
		</div>
	</h3>

	<div class="slider-container">
		<div class="slider-header">
			<label for="linksPercentileSlider" class="slider-title">{linksPercentileSlider.label}:</label>
			<small class="slider-explanation">{linksPercentileSlider.description}</small>
		</div>
		<div class="range-slider" class:easter-egg={easterEggActive}>
			<input
				type="range"
				id="linksPercentileSlider"
				bind:value={linksPercentileSlider.value}
				min={linksPercentileSlider.config.min}
				max={linksPercentileSlider.config.max}
				step="any"
				class="slider"
				on:input={updateLinksPercentile}
			/>
			<div class="slider-min-max">
				<span class="slider-min">{linksPercentileSlider.config.min}</span>
				<output for="linksPercentileSlider" id="linksPercentileOutput" class="slider-output">
					{Slider.calculateOriginalValue(linksPercentileSlider.value, linksPercentileSlider.config)}
				</output>
				<span class="slider-max">{linksPercentileSlider.config.max}</span>
			</div>
		</div>
	</div>

	{#if $isForceAtlas}
		<ForceLayoutSettings {easterEggActive} />
	{:else}
		<ForceAtlas2Settings {easterEggActive} />
	{/if}
</div>

<style>
	/* @import 'src/components/forces/forceStyles.css'; */

	.force-panel {
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}
	.force-clickable {
		cursor: pointer;
		color: inherit;
		text-decoration: none;
		outline: none;
	}
	.title-container {
		display: inline-flex;
		align-items: center;
	}

</style>
