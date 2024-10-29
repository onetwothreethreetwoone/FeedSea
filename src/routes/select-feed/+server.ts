import { queueFeedRequest } from '../../lib/articles';
import { hasSubscriber } from '../../lib/updates/subscribers';

import type { FeedWithUnreadStories } from '../../lib/types';

export async function POST({ request }) {
  const cookie = request.headers.get('cookie');
  const clientId = cookie?.split('sessionid=')[2];

  if (!clientId || !hasSubscriber(clientId))
    return new Response(null, { status: 401 });

  try {
    const feed: FeedWithUnreadStories = await request.json();

    queueFeedRequest(feed, clientId);

    return new Response('Feed request queued successfully', { status: 200 });
  } catch (error) {
    console.error('Error queuing feed request:', error);
    return new Response('Error processing request', { status: 500 });
  }
}