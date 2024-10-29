// import { graphLogger as logger } from '../../logger';
import { get } from 'svelte/store';

import { focusedArticleId } from '$lib/stores/stores';
import { isNightMode } from '$lib/stores/night';
import { isForceAtlas } from '$lib/stores/forces';
import { lightDrawDiscNodeHover, darkDrawDiscNodeHover } from './customHover';
import { defaultForceAtlasSettings, defaultForceAtlas2Settings } from '../forces/defaultGraphSettings';

import Graph from "graphology";
import Sigma from "sigma";
import ForceSupervisor from "graphology-layout-force/worker";
import ForceAtlasSupervisor from 'graphology-layout-forceatlas2/worker';

import { EdgeClampedProgram } from 'sigma/rendering';

import type { Attributes } from 'graphology-types';
import type { ForceLayoutSettings } from 'graphology-layout-force';
import type { ForceAtlas2Settings } from 'graphology-layout-forceatlas2';
import type { GraphData, Link, Node } from '$lib/types';
import { getSelectedLinks } from '$lib/updates/updates';


let graphContainer: HTMLElement;
let sigmaInstance: Sigma;
let graphInstance: Graph;
let layoutInstance: ForceSupervisor | ForceAtlasSupervisor;
let layoutType: string = 'forceAtlas';
let layoutSettings: ForceLayoutSettings | ForceAtlas2Settings;
let draggedNode: string | null = null;
let isDragging: boolean = false;
let settings: Attributes;
let DayOrNight: boolean;



function initializeSigmaGraph(container: HTMLElement) {
    graphContainer = container;

    graphInstance = new Graph();
    sigmaInstance = new Sigma(graphInstance, graphContainer, {
        // hideEdgesOnMove: true,
        // allowInvalidContainer: true, 
        labelDensity: 1,
        labelGridCellSize: 150,
        edgeProgramClasses: {
            default: EdgeClampedProgram
        }
    });

    DayOrNight = get(isNightMode);
    updateDayNightMode();

    layoutType = getLayoutType();
    layoutSettings = getSettings();
    settings = {
        isNodeFixed: (_: unknown, attr: Attributes) => attr.highlighted,
        settings: layoutSettings
    };
    layoutInstance = setLayout();

    initializeInteractions();
    startLayout();
}

function initializeInteractions() {
    if (!sigmaInstance) return;

    sigmaInstance.on("downNode", (e) => {
        isDragging = true;
        draggedNode = e.node;
        graphInstance.setNodeAttribute(draggedNode, "highlighted", true);
        focusedArticleId.set(e.node);
    });

    sigmaInstance.getMouseCaptor().on("mousemovebody", (e) => {
        if (!isDragging || !draggedNode || !sigmaInstance) return;
        const pos = sigmaInstance.viewportToGraph(e);

        graphInstance.setNodeAttribute(draggedNode, "x", pos.x);
        graphInstance.setNodeAttribute(draggedNode, "y", pos.y);

        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
    });

    sigmaInstance.getMouseCaptor().on("mouseup", () => {
        if (draggedNode) {
            graphInstance?.removeNodeAttribute(draggedNode, "highlighted");
        }
        isDragging = false;
        draggedNode = null;
    });

    sigmaInstance.getMouseCaptor().once("mousedown", () => {
        if (!sigmaInstance.getCustomBBox()) sigmaInstance.setCustomBBox(sigmaInstance.getBBox());
    });
}

function getLayoutType() {
    const loadedLayoutType = localStorage.getItem('layoutType');
    if (loadedLayoutType) isForceAtlas.update(() => loadedLayoutType === 'forceAtlas');
    return loadedLayoutType || 'forceAtlas';
}

function getSettings() {
    if (layoutType === 'forceAtlas') {
        const settings = localStorage.getItem('layoutForceSettings');
        return settings ? JSON.parse(settings) : defaultForceAtlasSettings;
    } else {
        const settings = localStorage.getItem('layoutFA2Settings');
        return settings ? JSON.parse(settings) : defaultForceAtlas2Settings;
    }
}


const setLayout = (res: boolean = layoutType === "forceAtlas") => res
    ? new ForceSupervisor(graphInstance, settings)
    : new ForceAtlasSupervisor(graphInstance, settings);

function addNewNodes(nodes: Node[]) {
    const tempGraph: Graph = new Graph();
    for (const node of nodes)
        tempGraph.addNode(node.id, {
            x: node.x,
            y: node.y,
            size: node.size,
            color: node.color,
            label: node.title,
            title: node.title,
        });
    graphInstance.import(tempGraph);
}

function addNewLinks(links: Link[]) {
    const tempGraph: Graph = graphInstance.emptyCopy();
    for (const link of links)
        tempGraph.addEdgeWithKey(
            `${link.source}_${link.target}`,
            link.source,
            link.target,
            {
                weight: link.weight,
                color: DayOrNight ? link.day_color : link.night_color
            }
        );
    graphInstance.import(tempGraph, true);
}

function redrawLinks(links: Link[]) {
    graphInstance.clearEdges();
    addNewLinks(links);
}

function removeNodesById(nodes: Set<string>, links: Link[] = []) {
    layoutInstance.kill();
    const tempGraph: Graph = graphInstance.emptyCopy();
    nodes.forEach(node => tempGraph.dropNode(node));
    graphInstance = tempGraph;
    addNewLinks(links);
    sigmaInstance.setGraph(graphInstance);
    layoutInstance = setLayout();
    startLayout();
}

function addAll(graphData: GraphData) {
    if (!graphInstance) return;
    graphInstance.clearEdges();
    addBoth(graphData);
}

function addBoth(graphData: GraphData) {
    if (graphData.nodes.length > 0) addNewNodes(graphData.nodes);
    if (graphData.links.length > 0) addNewLinks(graphData.links);
}

function clearGraph() {
    graphInstance.clear();
    graphInstance = new Graph();
    sigmaInstance.kill();
    layoutInstance.kill();
    sigmaInstance = new Sigma(graphInstance, graphContainer, {
        labelDensity: 1,
        labelGridCellSize: 150,
        edgeProgramClasses: { default: EdgeClampedProgram }
    });
    initializeInteractions();
    if (DayOrNight) {
        sigmaInstance.setSetting("labelColor", { color: '#000000' });
        sigmaInstance.setSetting("defaultDrawNodeHover", lightDrawDiscNodeHover);
    } else {
        sigmaInstance.setSetting("labelColor", { color: '#FFFFFF' });
        sigmaInstance.setSetting("defaultDrawNodeHover", darkDrawDiscNodeHover);
    }
    layoutInstance = setLayout();
    startLayout();
}

function startLayout() {
    layoutInstance.start();
}

function stopLayout() {
    if (layoutInstance?.isRunning()) layoutInstance.stop();
}

function updateDayNightMode() {
    if (!sigmaInstance || !graphInstance) return;
    if (!DayOrNight) {
        sigmaInstance.setSetting("labelColor", { color: '#000000' });
        sigmaInstance.setSetting("defaultDrawNodeHover", lightDrawDiscNodeHover);
        DayOrNight = true;
    } else if (DayOrNight) {
        sigmaInstance.setSetting("labelColor", { color: '#FFFFFF' });
        sigmaInstance.setSetting("defaultDrawNodeHover", darkDrawDiscNodeHover);
        DayOrNight = false;
    }
    redrawLinks(getSelectedLinks());
}

function updateForceSettings(newSettings: ForceLayoutSettings | ForceAtlas2Settings) {
    if (!layoutSettings || !settings) return;
    layoutSettings = { ...layoutSettings, ...newSettings };
    settings.settings = layoutSettings;
    saveCurrentSettings();
    stopLayout();
    layoutInstance.kill();
    layoutInstance = setLayout();
    startLayout();
}

function saveCurrentSettings() {
    if (layoutType === 'forceAtlas')
        localStorage.setItem('layoutForceSettings', JSON.stringify(layoutSettings));
    else
        localStorage.setItem('layoutFA2Settings', JSON.stringify(layoutSettings));
}

function switchLayout() {
    saveCurrentSettings();
    const res = layoutType === 'forceAtlas';
    layoutType = res ? 'forceAtlas2' : 'forceAtlas';
    localStorage.setItem('layoutType', layoutType);
    layoutSettings = getSettings();
    settings.settings = layoutSettings;
    stopLayout();
    layoutInstance.kill();
    layoutInstance = setLayout();
    startLayout();
    isForceAtlas.update(() => !res);
    return res;
}

export {
    initializeSigmaGraph,
    clearGraph,
    updateDayNightMode,
    updateForceSettings,
    addBoth,
    addNewNodes,
    addNewLinks,
    removeNodesById,
    switchLayout,
    addAll,
    redrawLinks
};