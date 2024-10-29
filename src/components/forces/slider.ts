export type ScaleType = 'log' | 'linear';
// type SliderId = keyof ForceLayoutSettings | keyof ForceAtlas2Settings;

interface SliderConfig {
	min: number;
	max: number;
	precision: number;
	scaleType: ScaleType;
}

type SliderId<T> = keyof T | string;
// type SliderId<T> = string;


interface SliderType<T> {
    id: SliderId<T>;
	label: string;
	description: string;
	value: number;
	config: SliderConfig;
}

class Slider<T> implements SliderType<T> {
    id: SliderId<T>;
	label: string;
	description: string;
	value: number;
	config: SliderConfig;

	constructor(
		id: SliderId<T>,
		label: string,
		description: string,
		defaultValue: number,
		config: SliderConfig
	) {
		this.id = id;
		this.label = label;
		this.description = description;
		this.config = config;
		this.value = Slider.calculateScaledValue(defaultValue, config);
	}

	static calculateScaledValue(value: number, config: SliderConfig): number {
		return config.scaleType === 'log'
			? (Math.log(value) - Math.log(config.min)) /
			((Math.log(config.max) - Math.log(config.min)) / 100)
			: value;
	}

	static calculateOriginalValue(scaledValue: number, config: SliderConfig): number {
		let originalValue;
		if (config.scaleType === 'log') {
			originalValue = Math.exp(
				Math.log(config.min) + scaledValue * ((Math.log(config.max) - Math.log(config.min)) / 100)
			);
		} else {
			originalValue = scaledValue;
		}
		return Number(originalValue.toFixed(config.precision));
	}
}

export default Slider;