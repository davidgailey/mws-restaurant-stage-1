const staticAssetsCacheName = 'mws-restaurant-static-v1';
const assets = [
					'/',
					'./index.html',
					'./restaurant.html',
					'./css/styles.css',
					'./data/restaurants.json',
					'./js/dbhelper.js',
					'./js/main.js',
					'./js/restaurant_info.js',
					'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
					'//normalize-css.googlecode.com/svn/trunk/normalize.css',
					'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
				];

self.addEventListener('install', event => {

	event.waitUntil(
		caches.open(staticAssetsCacheName).then( cache => {
			return cache.addAll(assets);
		})
	);
	
});

self.addEventListener('fetch', event => {

  event.respondWith(
    caches.match(event.request).then( response => {
      return response || fetch(event.request);
    })
  );

});

