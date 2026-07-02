// Registers the service worker. Kept as an external file (not inline) so the
// page's Content-Security-Policy can stay strict (script-src 'self').
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function (e) {
      console.warn('Service worker registration failed:', e);
    });
  });
}
