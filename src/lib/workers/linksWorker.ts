import { processLinks } from '../../components/graph/graph';

self.onmessage = async (event) => {
    self.postMessage( await processLinks(
        event.data.nodes,
        event.data.newPairs
    ));
};