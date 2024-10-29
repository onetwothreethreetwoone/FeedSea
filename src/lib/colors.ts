import chroma from 'chroma-js';
import type { FeedsWithColor, FeedWithColor, Feeds } from './types';

function getColorForFeed(index: number, totalFeeds: number): string {

    // Define the hue ranges for pastel blue and green
    const hueBlueStart = 180, hueBlueEnd = 220; // Range for pastel blues
    const hueGreenStart = 80, hueGreenEnd = 140; // Range for pastel greens

    // Calculate the number of feeds that will be assigned each color
    const totalBlueFeeds = Math.ceil(totalFeeds / 2);
    const totalGreenFeeds = Math.floor(totalFeeds / 2);

    // Calculate the step size for each range
    const stepSizeBlue = (hueBlueEnd - hueBlueStart) / totalBlueFeeds;
    const stepSizeGreen = (hueGreenEnd - hueGreenStart) / totalGreenFeeds;

    const isBlue = Number(index) % 2 === 0;
    const colorIndex = Math.floor(Number(index) / 2);
    const hue = isBlue
        ? hueBlueStart + (colorIndex * stepSizeBlue)
        : hueGreenStart + (colorIndex * stepSizeGreen);

    // Create a pastel color with the calculated hue
    const saturation = 60; // Saturation for pastel colors
    const lightness = 85; // Lightness for pastel colors
    const color = `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;

    return color;

}

export function generateColors(feeds: Feeds): FeedsWithColor {
    const feedsWithColor: FeedsWithColor = {};
    Object.entries(feeds).forEach(([key, feed]) => {
        const color = getColorForFeed(parseInt(key), Object.keys(feeds).length);
        const feedWithColor: FeedWithColor = { ...feed, color };
        feedsWithColor[key] = feedWithColor;
    });
    return feedsWithColor;
}


export function getColorFromString(color: string) : string {
    // Extract the hue, saturation, and lightness components from the color string
    const hslMatch = color.match(/hsl\(([^,]+),\s*([^,]+)%,\s*([^,]+)%\)/);
    if (!hslMatch) {
        console.error('Invalid HSL color string:', color);
        return '#000'; // Fallback to black if the color string is invalid
    }

    // Normalize the hue to be between 0 and 360
    const rawHue = parseFloat(hslMatch[1]);
    const hue = rawHue % 360;
    const saturation = parseFloat(hslMatch[2]);
    const lightness = parseFloat(hslMatch[3]);

    // logger.log("Hue:", hue, "Saturation:", saturation, "Lightness:", lightness);

    // Use Chroma.js to construct a valid HSL color
    const hslColor = chroma.hsl(hue, saturation / 100, lightness / 100).css();
    return hslColor;
}

export function getStringFromColor(color: string | number | chroma.Color) {
    // Convert the Chroma.js color object to HSL and destructure it into components
    const [hue, saturation, lightness] = chroma(color).hsl();

    // Normalize the hue to be between 0 and 360
    const normalizedHue = hue % 360;

    // Construct a valid HSL color string
    const hslColorString = `hsl(${normalizedHue}, ${saturation * 100}%, ${lightness * 100}%)`;
    return hslColorString;
}