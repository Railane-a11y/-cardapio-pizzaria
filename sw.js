// ============================================================
//  SERVICE WORKER — CasadasPizzaass PWA
//  Estratégia: Network First com fallback para cache
//  Versão: 1.0 — Atualizar CACHE_NAME para forçar recache
// ============================================================

const CACHE_NAME = 'casadaspizzaass-v1';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// ========== INSTALAÇÃO ==========
// Cacheia os assets essenciais na primeira visita
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting()) // Ativa imediatamente sem esperar aba fechar
    );
});

// ========== ATIVAÇÃO ==========
// Remove caches antigos quando uma nova versão é instalada
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim()) // Assume controle de todas as abas abertas
    );
});

// ========== FETCH (Network First) ==========
// Tenta buscar da rede primeiro. Se falhar (offline), usa o cache.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Ignora requisições para Netlify Functions (nunca cachear API)
    if (url.pathname.startsWith('/.netlify/')) return;

    // Ignora requisições que não são GET (POST, PUT, etc.)
    if (event.request.method !== 'GET') return;

    // Ignora requisições para outros domínios (ex: wa.me, analytics)
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Se a rede respondeu, salva no cache para uso futuro
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Rede falhou (offline) — tenta servir do cache
                return caches.match(event.request);
            })
    );
});
