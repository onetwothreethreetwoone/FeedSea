// import ForceGraph3D from '3d-force-graph';
// import type { ForceGraph3DInstance } from '3d-force-graph';
// import type { GraphData, Node, Link } from '$lib/types';
// // import type { Renderer } from 'three';
// import {
//     CSS2DRenderer,
//     // CSS2DObject 
// } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
// import { Vector2, type Renderer } from 'three';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
// import { focusedArticleId } from '$lib/stores/stores';

// let graphInstance: ForceGraph3DInstance;
// const graphData: GraphData = { nodes: [], links: [] };

// function initializeGraph(container: HTMLElement) {
//     graphInstance = ForceGraph3D({
//         extraRenderers: [new CSS2DRenderer() as unknown as Renderer]
//     })(container)
//         .backgroundColor('#000000')
//         .nodeColor('color')
//         .nodeLabel('title')
//         // .nodeThreeObject(node => {
//         //     const nodeEl = document.createElement('div');
//         //     // console.log('node ' + (Object.getOwnPropertyNames(node)));
//         //     nodeEl.textContent = node.title as string;
//         //     nodeEl.style.color = 'white';
//         //     nodeEl.className = 'node-label';
//         //     return new CSS2DObject(nodeEl);
//         // })
//         .nodeThreeObjectExtend(true)
//         .linkCurveRotation('rotation')
//         .linkCurvature(parseFloat('weight'))
//         .linkOpacity(parseFloat('weight'))
//         .linkColor('color')
//         .width(1920)
//         .height(1080)
//         .onNodeClick(node => focusedArticleId.set(node.id))
//         .graphData(graphData)


//     graphInstance.d3Force('charge')?.strength(-100);
//     const bloomPass = new UnrealBloomPass(
//         new Vector2(1920, 1080), 0.1, 10, 0
//     );
//     graphInstance.postProcessingComposer().addPass(bloomPass);
// }













// function addNodes(nodes: Node[]) {
//     graphData.nodes.push(...nodes);
//     graphInstance.graphData(graphData);
// }

// function addLinks(links: Link[]) {
//     for (const link of links) graphData.links.push(link);
//     graphInstance.graphData(graphData);
// }

// function removeNodesById(nodeIds: Set<string>) {
//     graphData.nodes = graphData.nodes.filter(node => !nodeIds.has(node.id));
//     graphData.links = graphData.links.filter(link => !nodeIds.has(link.source) && !nodeIds.has(link.target));
//     graphInstance.graphData(graphData);
// }


// function addBoth(graphData: GraphData) {
//     if (graphData.nodes.length > 0) addNodes(graphData.nodes);
//     if (graphData.links.length > 0) addLinks(graphData.links);
// }

// function clearGraph() {
//     graphData.nodes = [];
//     graphData.links = [];
//     graphInstance.graphData(graphData);
// }

// function redrawLinks(links: Link[]) {
//     if (links.length > 0) {
//         const copiedLinks = structuredClone(links);
//         graphData.links = [];
//         addLinks(copiedLinks);
//     }
// }

// function dummy() { }

// export {
//     addBoth as addAll,
//     addBoth,
//     redrawLinks,
//     clearGraph,
//     initializeGraph as initializeSigmaGraph,
//     addNodes as addNewNodes,
//     addLinks as addNewLinks,
//     removeNodesById,
//     dummy as switchLayout,
//     dummy as updateDayNightMode,
//     dummy as updateForceSettings
// };