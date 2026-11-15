/* Time Tracker offline support: online → always fetch the latest; offline → use the saved copy */
const C='tracker-v8';
const CORE=['./','index.html','world.json','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  if(new URL(r.url).origin!==location.origin) return;          // GitHub sync calls go straight to the network
  e.respondWith((async()=>{
    const cache=await caches.open(C);
    try{
      const net=await Promise.race([fetch(r),new Promise((_,no)=>setTimeout(()=>no('slow'),4000))]);
      if(net&&net.ok) cache.put(r,net.clone());
      return net;
    }catch(x){
      const hit=await cache.match(r,{ignoreSearch:true})||(r.mode==='navigate'?(await cache.match('index.html'))||(await cache.match('./')):null);
      return hit||Response.error();
    }
  })());
});
