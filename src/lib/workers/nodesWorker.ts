import { articlesToNodes } from '../../components/graph/graph';

self.onmessage = async (event) =>
    self.postMessage(articlesToNodes(event.data));