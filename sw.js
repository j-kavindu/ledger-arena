'use strict';
const CACHE='ledger-arena-offline-sync-20261027-1';
const APP=['./','./index.html','./app.js','./auth.js','./progress-model.js','./cloud-sync.js','./pwa.js','./style.css','./bank.json','./catalog.json','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('ledger-arena-offline-')&&name!==CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('message',event=>{if(event.data==='APPLY_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET')return;
 const scope=new URL(self.registration.scope);
 const local=url.origin===scope.origin&&url.pathname.startsWith(scope.pathname);
 const sdk=url.origin==='https://www.gstatic.com'&&url.pathname.startsWith('/firebasejs/13.1.0/');
 if(!local&&!sdk)return;
 // Never cache authentication routes, tokens, or user-owned cloud data.
 const name=url.pathname.slice(scope.pathname.length);
 if(local&&name&& !APP.some(file=>file.replace('./','')===name))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>response.ok?response:caches.match(new URL('index.html',scope).href)).catch(()=>caches.match(new URL('index.html',scope).href)));return;
 }
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(request,{ignoreSearch:local});if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response})());
});
