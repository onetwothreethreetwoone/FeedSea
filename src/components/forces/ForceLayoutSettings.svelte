<script lang="ts">
	import './forceStyles.css';

	import Slider from './slider';
	import { forcePanelSettings } from './forceSettingsStore';
	import { defaultForceAtlasSettings } from './defaultGraphSettings';
	import { updateForceSettings } from '../graph/SigmaGraphUpdate';
	import type { ForceLayoutSettings } from 'graphology-layout-force';

	const loadedSettings = localStorage.getItem('layoutForceSettings');
	const initialSettings = loadedSettings ? JSON.parse(loadedSettings) : defaultForceAtlasSettings;

	let sliders: Slider<ForceLayoutSettings>[] = [
		new Slider<ForceLayoutSettings>(
			'gravity',
			'Gravity',
			'Higher gravity pulls nodes closer to center, lower lets them drift apart.',
			initialSettings.gravity,
			{
				min: 0.00001,
				max: 10,
				precision: 5,
				scaleType: 'log'
			}
		),
		new Slider<ForceLayoutSettings>(
			'repulsion',
			'Repulsion',
			'Higher repulsion spreads nodes further apart, lower brings them closer.',
			initialSettings.repulsion,
			{
				min: 0.000001,
				max: 10,
				precision: 9,
				scaleType: 'log'
			}
		),
		new Slider<ForceLayoutSettings>(
			'attraction',
			'Attraction',
			'Higher attraction increases the force pulling connected nodes together.',
			initialSettings.attraction,
			{
				min: 0.000001,
				max: 1,
				precision: 8,
				scaleType: 'log'
			}
		),
		new Slider<ForceLayoutSettings>(
			'inertia',
			'Inertia',
			'Higher inertia maintains node velocity, lower inertia slows nodes down faster.',
			initialSettings.inertia,
			{
				min: 0,
				max: 5,
				precision: 1,
				scaleType: 'linear'
			}
		),
		new Slider<ForceLayoutSettings>(
			'maxMove',
			'Max Move',
			'Higher max move allows nodes to move further in each iteration.',
			initialSettings.maxMove,
			{
				min: 0,
				max: 20,
				precision: 1,
				scaleType: 'linear'
			}
		)
	];

	function updateSettings() {
		const settings: ForceLayoutSettings = sliders.reduce((acc, slider) => {
			acc[slider.id as keyof ForceLayoutSettings] = Slider.calculateOriginalValue(
				slider.value,
				slider.config
			);
			return acc;
		}, {} as ForceLayoutSettings);
		forcePanelSettings.set(settings);
		updateForceSettings(settings);
	}

	export let easterEggActive: boolean;
</script>

<div id="forceSettings">
	{#each sliders as slider}
		<div class="slider-container">
			<div class="slider-header">
				<label for="{slider.id}Slider" class="slider-title">{slider.label}:</label>
				<small class="slider-explanation">{slider.description}</small>
			</div>

			<div class="range-slider" class:easter-egg={easterEggActive}>
				<input
					type="range"
					id="{slider.id}Slider"
					bind:value={slider.value}
					min={slider.config.scaleType === 'log' ? 0 : slider.config.min}
					max={slider.config.scaleType === 'log' ? 100 : slider.config.max}
					step="any"
					class="slider"
					on:input={updateSettings}
				/>
				<div class="slider-min-max">
					<span class="slider-min">{slider.config.min}</span>
					<output for="{slider.id}Slider" id="{slider.id}Output" class="slider-output">
						{Slider.calculateOriginalValue(slider.value, slider.config)}
					</output>
					<span class="slider-max">{slider.config.max}</span>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	/* @import 'src/components/forces/forceStyles.css'; */
</style>
