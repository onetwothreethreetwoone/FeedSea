import { stopAllRequests } from '$lib/articles';
import { getArticleEvents } from '$lib/articles';
import { hasSubscriber } from '$lib/updates/subscribers';

export async function POST({ request }) {
  const cookie = request.headers.get('cookie');
  const clientId = cookie?.split('sessionid=')[2];

  if (!clientId || !hasSubscriber(clientId))
    return new Response(null, { status: 401 });

  try {
    const articleEvents = getArticleEvents(clientId);
    stopAllRequests(clientId);
    articleEvents.emit('jobComplete');
  } catch (error) {
    console.error(error);
  }
  return new Response(null, { status: 200 });
}