import { Articles, getArticleEvents } from '$lib/articles';
import { hasSubscriber, removeSubscriber } from '$lib/updates/subscribers';

export async function GET({ request }) {
    const cookie = request.headers.get('cookie');
    const clientId = cookie?.split('sessionid=')[2];

    if (!clientId || !hasSubscriber(clientId)) {
        return new Response(null, { status: 401 });
    }

    const headers = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    };

    const stream = new TransformStream({
        start(controller) {
            const articleEvents = getArticleEvents(clientId);

            const articleFetchedListener = (compressedArticles: string) => {
                try {
                    controller.enqueue(`event: articleFetched\ndata: ${JSON.stringify({ compressedArticles })}\n\n`);
                } catch (error) {
                    // maybe some logging ?
                }
            };

            const jobCompleteListener = () => {
                const articleEvents = getArticleEvents(clientId);
                articleEvents.off('articleFetched', articleFetchedListener);
                articleEvents.off('jobComplete', jobCompleteListener);
                Articles.destroyInstance(clientId);
                removeSubscriber(clientId);
                //controller.terminate();
            };

            articleEvents.on('articleFetched', articleFetchedListener);
            articleEvents.on('jobComplete', jobCompleteListener);
        },
        flush() {
            removeSubscriber(clientId);
        }
    });

    return new Response(stream.readable, { headers });
}