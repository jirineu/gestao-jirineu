// Este arquivo permite que o site seja instalável
self.addEventListener('install', (e) => {
    console.log('Service Worker instalado');
});

self.addEventListener('fetch', (event) => {
    // Necessário para cumprir o requisito de PWA
});
