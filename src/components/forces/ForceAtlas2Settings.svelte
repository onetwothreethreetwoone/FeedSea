<script lang="ts">
	import './forceStyles.css';
	import './forceAtlasStyles.css';

	import Slider from './slider';
	import Toggle from './toggle';
	import { atlas2PanelSettings } from './forceSettingsStore';
	import { defaultForceAtlas2Settings } from './defaultGraphSettings';

	import type { ForceAtlas2Settings } from 'graphology-layout-forceatlas2';
	import { updateForceSettings } from '../graph/SigmaGraphUpdate';

	const loadedSettings = localStorage.getItem('layoutFA2Settings');
	const initialSettings = loadedSettings ? JSON.parse(loadedSettings) : defaultForceAtlas2Settings;

	let sliders: Slider<ForceAtlas2Settings>[] = [
		new Slider<ForceAtlas2Settings>(
			'gravity',
			'Gravity',
			'Higher gravity pulls nodes closer to center, lower lets them drift apart.',
			initialSettings.gravity,
			{ min: 0.001, max: 1000, precision: 5, scaleType: 'log' }
		),
		new Slider<ForceAtlas2Settings>(
			'scalingRatio',
			'Scaling Ratio',
			'Ratio for scaling.',
			initialSettings.scalingRatio,
			{ min: 0.0001, max: 10, precision: 5, scaleType: 'log' }
		),
		new Slider<ForceAtlas2Settings>(
			'slowDown',
			'Slow Down',
			'Controls the slowdown rate.',
			initialSettings.slowDown,
			{ min: 0.1, max: 100, precision: 5, scaleType: 'log' }
		),
		new Slider<ForceAtlas2Settings>(
			'edgeWeightInfluence',
			'Edge Weight Influence',
			'Influence of the edge weight.',
			initialSettings.edgeWeightInfluence,
			{ min: 0, max: 1, precision: 5, scaleType: 'linear' }
		),
		new Slider<ForceAtlas2Settings>(
			'barnesHutTheta',
			'Barnes Hut Theta',
			'Theta parameter for the Barnes-Hut optimization.',
			initialSettings.barnesHutTheta,
			{ min: 0, max: 2, precision: 5, scaleType: 'linear' }
		)
	];

	let toggles: Toggle<ForceAtlas2Settings>[] = [
		new Toggle<ForceAtlas2Settings>(
			'linLogMode',
			'LinLog Mode',
			initialSettings.linLogMode,
			'Toggles the linear logarithmic mode.'
		),
		new Toggle<ForceAtlas2Settings>(
			'outboundAttractionDistribution',
			'Outbound Attraction Distribution',
			initialSettings.outboundAttractionDistribution,
			'Controls the distribution of outbound attraction.'
		),
		new Toggle<ForceAtlas2Settings>(
			'adjustSizes',
			'Adjust Sizes',
			initialSettings.adjustSizes,
			'Adjusts node sizes to avoid overlap.'
		),
		new Toggle<ForceAtlas2Settings>(
			'strongGravityMode',
			'Strong Gravity Mode',
			initialSettings.strongGravityMode,
			'Enables or disables strong gravity mode.'
		),
		new Toggle<ForceAtlas2Settings>(
			'barnesHutOptimize',
			'Barnes Hut Optimize',
			initialSettings.barnesHutOptimize,
			'Toggles the Barnes-Hut optimization.'
		)
	];

	function updateToggleSettings() {
		const booleanSettings = toggles.reduce(
			(acc, toggle) => {
				acc[toggle.id] = toggle.value;
				return acc;
			},
			{} as Record<string, boolean>
		);
		atlas2PanelSettings.update((settings) => {
			const updatedSettings = { ...settings, ...booleanSettings };
			updateForceSettings(updatedSettings);
			return updatedSettings;
		});
	}

	function updateSliderSettings() {
		const numberSettings = sliders.reduce(
			(acc, slider) => {
				acc[slider.id] = Slider.calculateOriginalValue(slider.value, slider.config);
				return acc;
			},
			{} as Record<string, number>
		);
		atlas2PanelSettings.update((settings) => {
			const updatedSettings = { ...settings, ...numberSettings };
			updateForceSettings(updatedSettings);
			return updatedSettings;
		});
	}

	export let easterEggActive: boolean;
</script>

<div id="forceSettings" class:easter-egg={easterEggActive}>
	{#each sliders as slider}
		<div class="slider-container">
			<div class="slider-header">
				<label for="{slider.id}Slider" class="slider-title">{slider.label}:</label>
				<small class="slider-explanation">{slider.description}</small>
			</div>
			<div class="slider-with-output">
				<input
					type="range"
					id="{slider.id}Slider"
					bind:value={slider.value}
					min={slider.config.scaleType === 'log' ? 0 : slider.config.min}
					max={slider.config.scaleType === 'log' ? 100 : slider.config.max}
					step="any"
					class="slider"
					on:input={updateSliderSettings}
				/>
				<div class="slider-min-max">
					<span class="slider-min">{slider.config.min}</span>
					<output for="{slider.id}Slider" class="slider-output">
						{Slider.calculateOriginalValue(slider.value, slider.config)}
					</output>
					<span class="slider-max">{slider.config.max}</span>
				</div>
			</div>
		</div>
	{/each}
	<div class="toggle-container">
		{#each toggles as toggle}
			<div class="toggle-item">
				<div class="toggle-info">
					<span class="toggle-title">{toggle.label}:</span>
					<span class="toggle-description">{toggle.description}</span>
				</div>
				<input
					type="checkbox"
					id="{toggle.id}Toggle"
					class="toggle-input"
					bind:checked={toggle.value}
					on:change={updateToggleSettings}
				/>
				<label for="{toggle.id}Toggle" class="toggle-switch"></label>
			</div>
		{/each}
	</div>
</div>

<style>
    /* @import 'src/components/forces/forceStyles.css';
    @import 'src/components/forces/forceAtlasStyles.css'; */
</style>