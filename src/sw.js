import idb from 'idb';

const idbPromise = idb.open('mws-restaurant', 1, upgradeDB => {
	switch (upgradeDB.oldVersion) {
		case 0:
			upgradeDB.createObjectStore('restaurants', {
				keyPath: 'id'
			});
			
	}
});

const staticAssetsCacheName = 'mws-restaurant-static-v2';
const assets = [
	'/',
	'https://davidgailey.github.io/mws-restaurant-stage-1/',
	'https://davidgailey.github.io/mws-restaurant-stage-1/index.html',
	'https://davidgailey.github.io/mws-restaurant-stage-1/restaurant.html',
	'https://davidgailey.github.io/mws-restaurant-stage-1/css/styles.css',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/dbhelper.js',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/main.js',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/restaurant_info.js',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css'
];

self.addEventListener('install', event => {

	event.waitUntil(
		caches.open(staticAssetsCacheName).then(cache => {
			return cache.addAll(assets);
		})
	);

});

self.addEventListener('fetch', fetchEvent => {

	// check URL to see if it is an api call to get restaurant data
	const requestURL = new URL(fetchEvent.request.url);
	const isAPI = requestURL.port === '1337' ? true : false;

	// if it is an api call, handle it with indexedDB
	if (isAPI) {
		const id = requestURL.pathname.split( '/' )[1];
		
		if(typeof id !== 'undefined') handleAPIRequest(fetchEvent, id);
	
	} else {
		// if it is a normal request, handle with cache
		fetchEvent.respondWith(
			caches.match(fetchEvent.request).then(response => {
				return response || fetch(fetchEvent.request);
			})
		);
	}
});

const handleAPIRequest = (fetchEvent, id) => {
	
	fetchEvent.respondWith(

		idbPromise // from idb.open on line 3ish

			// check indexedDB to see if json from the API is already stored... 
			.then(idb => {
				return idb.transaction('restaurants').objectStore('restaurants').get(id);
			})
			.then(restaurantInfo => {
				if (restaurantInfo && restaurantInfo.data){
					// if yes then return restaurantInfo
					// means earlier idb transaction succeeded
					// return new Response(restaurantInfo.data);
					console.log('restaurant info returned from indexedDB');
					return restaurantInfo.data
				}else{
					// or if json is not stored in the idb, fetch it
					// means earlier idb transaction failed
					console.log('restaurant info will return from fetch');
					return(
						fetch(fetchEvent.request)
						.then(fetchResponse => fetchResponse.json())
						.then(json => {
							return idbPromise.then(db => {
								// new transaction
								let tx = db.transaction('restaurants', 'readwrite');
								// select store
								let store = tx.objectStore('restaurants');
								// write json to the idb store
								store.put({ id: id, data: json });
								// return the json to next 'then' statement
								return json;
							});
						})
					)
				}

			}).then(response => {
				return new Response(JSON.stringify(response));
			})
			
			.catch(error => {
				console.log('error in handleAPIRequest: ',error);
				return new Response('Something went terribly wrong!', {status: 500 });
			})
	);
}
