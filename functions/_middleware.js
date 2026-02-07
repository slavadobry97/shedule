// Cloudflare Pages Functions middleware для Next.js
export async function onRequest(context) {
    try {
        // Проксируем все запросы к Next.js серверу
        const url = new URL(context.request.url);

        // Для статических файлов возвращаем их напрямую
        if (url.pathname.startsWith('/_next/') ||
            url.pathname.startsWith('/static/') ||
            url.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf)$/)) {
            return context.next();
        }

        // Для всех остальных запросов возвращаем index.html
        return context.env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), context.request));
    } catch (error) {
        console.error('Middleware error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
