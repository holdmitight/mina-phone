/* Existing clients do not have a controller-change listener. On an update,
 * navigate them once after the new worker is active so they get its new HTML.
 * A first installation never interrupts the page. */
(() => {
  const isUpdate = Boolean(self.registration.active);
  let refreshed = false;
  self.addEventListener("activate", (event) => {
    if (!isUpdate || refreshed) return;
    refreshed = true;
    event.waitUntil((async () => {
      try { await self.clients.claim(); } catch { /* Already claimed or closed. */ }
      let windows;
      try {
        windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      } catch { return; }
      const scope = new URL(self.registration.scope);
      await Promise.all(windows.map(async (client) => {
        try {
          const url = new URL(client.url);
          if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
          await client.navigate(client.url);
        } catch { /* A closing tab must not fail worker activation. */ }
      }));
    })());
  });
})();
