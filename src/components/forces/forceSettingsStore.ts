import { writable } from 'svelte/store';
import { defaultForceAtlasSettings, defaultForceAtlas2Settings } from './defaultGraphSettings';
import type { ForceLayoutSettings } from 'graphology-layout-force';
import type { ForceAtlas2Settings } from 'graphology-layout-forceatlas2';

const loadedLayoutSettings = localStorage.getItem('layoutForceSettings');
const initialLayoutSettings = loadedLayoutSettings ? JSON.parse(loadedLayoutSettings) : defaultForceAtlasSettings;

const loadedAtlas2Settings = localStorage.getItem('layoutFA2Settings');
const initialAtlas2Settings = loadedAtlas2Settings ? JSON.parse(loadedAtlas2Settings) : defaultForceAtlas2Settings;

export const forcePanelSettings = writable<ForceLayoutSettings>(initialLayoutSettings);
export const atlas2PanelSettings = writable<ForceAtlas2Settings>(initialAtlas2Settings);