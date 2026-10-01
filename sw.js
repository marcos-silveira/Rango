/**
 * Rango PWA - Service Worker v2
 * Otimizado para Safari/WebKit e hospedagens com Clean URLs (Render, Vercel, Netlify).
 * Previne o erro "Response served by service worker has redirections".
 */

const CACHE_NAME = 'rango-cache-v2';

const ASSETS_TO_CACHE = [
  './',
  './css/style.css?v=2.0.0',
  './js/app.js?v=2.0.0',
  './manifest.webmanifest?v=2.0.0',
  './icons/favicon.svg',
  './icons/favicon-32x32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/**
 * Safari WebKit Workaround:
 * O WebKit proíbe que o Service Worker retorne responses com a flag interna "redirected: true"
 * para requisições de navegação. Esta função recria uma Response limpa, mantendo o conteúdo
 * e cabeçalhos, mas removendo a flag de redirecionamento.
 */
async function cleanResponse(response) {
  if (!response || !response.redirected) {
    return response;
  }
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

// 1. Instalação: baixa e limpa os recursos no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          const res = await fetch(asset);
          if (res.ok) {
            const clean = await cleanResponse(res);
            await cache.put(asset, clean);
          }
        } catch (err) {
          console.warn('[SW] Falha ao cachear asset:', asset, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. Ativação: assume controle imediatamente e remove caches antigos (v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interceptação de Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Tratamento especial para requisições de navegação (abertura do PWA / troca de página)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Tenta buscar no cache primeiro (offline-first para abertura rápida)
        const cached = await caches.match('./');
        if (cached) {
          // Atualiza em background
          fetch(event.request)
            .then(async (networkRes) => {
              if (networkRes && networkRes.status === 200) {
                const clean = await cleanResponse(networkRes);
                const cache = await caches.open(CACHE_NAME);
                await cache.put('./', clean);
              }
            })
            .catch(() => {});

          return await cleanResponse(cached);
        }

        // Se não estiver em cache, busca na rede e sanitiza
        try {
          const networkRes = await fetch(event.request);
          if (networkRes && networkRes.status === 200) {
            const clean = await cleanResponse(networkRes.clone());
            const cache = await caches.open(CACHE_NAME);
            cache.put('./', clean).catch(() => {});
          }
          return await cleanResponse(networkRes);
        } catch (err) {
          const fallback = await caches.match('./');
          if (fallback) return await cleanResponse(fallback);
          throw err;
        }
      })()
    );
    return;
  }

  // Para assets estáticos normais (CSS, JS, imagens, ícones)
  event.respondWith(
    (async () => {
      const cachedResponse = (await caches.match(event.request)) || (await caches.match(event.request, { ignoreSearch: true }));
      if (cachedResponse) {
        // Revalidação em segundo plano
        fetch(event.request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clean = await cleanResponse(networkResponse.clone());
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, clean);
            }
          })
          .catch(() => {});

        return await cleanResponse(cachedResponse);
      }

      // Busca na rede se não estiver em cache
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.status === 200) {
        const clean = await cleanResponse(networkResponse.clone());
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, clean).catch(() => {});
      }
      return await cleanResponse(networkResponse);
    })()
  );
});
