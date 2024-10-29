// import type { GraphSettings } from '$lib/types';
import type { ForceLayoutSettings } from 'graphology-layout-force';
import type { ForceAtlas2Settings } from 'graphology-layout-forceatlas2';

const defaultForceAtlasSettings: ForceLayoutSettings = {
    attraction: 0.00001,
    repulsion: 0.00004,
    gravity: 0.001,
    inertia: 0.6,
    maxMove: 1
};

const defaultForceAtlas2Settings: ForceAtlas2Settings = {
    linLogMode: false,
    outboundAttractionDistribution: false,
    adjustSizes: false,
    edgeWeightInfluence: 0.1,
    scalingRatio: 0.001,
    strongGravityMode: false,
    gravity: 0.1,
    slowDown: 42,
    barnesHutOptimize: false,
    barnesHutTheta: 0.5
};

export { defaultForceAtlasSettings, defaultForceAtlas2Settings };