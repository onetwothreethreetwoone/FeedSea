import { isActive } from "$lib/articles.js";
import { hasSubscriber } from "$lib/updates/subscribers";

export async function GET({ request }) {
    const cookie = request.headers.get('cookie');
    const clientId = cookie?.split('sessionid=')[2];
    // console.log("Received keep-alive for " + clientId);
    if (!clientId || !hasSubscriber(clientId))
        return new Response(null, { status: 401 });

    if (isActive(clientId))
        return new Response(null, { status: 200 });
}