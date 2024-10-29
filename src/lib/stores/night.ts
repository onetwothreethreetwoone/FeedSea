import { get, writable } from 'svelte/store';

let loadedTheme;
if (typeof window !== 'undefined') {
    loadedTheme = localStorage.getItem('user-theme');
}
export const isNightMode = writable(loadedTheme === 'dark');

export const theme = writable(loadedTheme || 'light');

export function applyTheme() {
    if (typeof window !== 'undefined') {
        const themeValue = get(theme);
        document.documentElement.setAttribute('data-theme', themeValue);
        localStorage.setItem('user-theme', themeValue);
    }
}