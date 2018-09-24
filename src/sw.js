import idb from 'idb';

const idbPromise = idb.open('mws-restaurant', 2, upgradeDB => {
	switch (upgradeDB.oldVersion) {
		case 0:
			upgradeDB.createObjectStore('restaurants', {
				keyPath: 'id'
			});
		case 1:
			{
				const idbReviewsStore = upgradeDB.createObjectStore("reviews", {
					keyPath: "id"
				});
				idbReviewsStore.createIndex("byrestaurantid", "byrestaurantid");

				upgradeDB.createObjectStore("pendingReviewPosts", {
					keyPath: "id",
					autoIncrement: true // this should create sequencial keys that can later be cursored over in order
				});
			}
	}
});


const staticAssetsCacheName = 'mws-restaurant-static-v2';
const assets = [
	'/',
	'https://davidgailey.github.io/mws-restaurant-stage-1/',
	'https://davidgailey.github.io/mws-restaurant-stage-1/manifest.json',
	'https://davidgailey.github.io/mws-restaurant-stage-1/icons/icons-192.png',
	'https://davidgailey.github.io/mws-restaurant-stage-1/icons/icons-512.png',
	'https://davidgailey.github.io/mws-restaurant-stage-1/index.html',
	'https://davidgailey.github.io/mws-restaurant-stage-1/restaurant.html',
	'https://davidgailey.github.io/mws-restaurant-stage-1/css/styles.css',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/dbhelper.js',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/main.js',
	'https://davidgailey.github.io/mws-restaurant-stage-1/js/restaurant_info.js',
	'https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/small/no-photo.jpg',
	'https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/medium/no-photo.jpg',
	'https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/large/no-photo.jpg',
	'https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/large/no-photo-banner.jpg',
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
		//const id = requestURL.pathname.split('/')[1];
		const id = new URL(event.request.url).searchParams.get("restaurant_id") - 0;
		const isReview = requestURL.pathname.match('reviews') ? true : false;

		if (isReview) {
			handleReviewRequest(fetchEvent);
		} else if (typeof id !== 'undefined') {
			handleAPIRequest(fetchEvent, id);
		}

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
			if (restaurantInfo && restaurantInfo.data) {
				// if yes then return restaurantInfo
				// means earlier idb transaction succeeded
				// return new Response(restaurantInfo.data);
				console.log('restaurant info returned from indexedDB');
				return restaurantInfo.data
			} else {
				// or if json is not stored in the idb, fetch it
				// means earlier idb transaction failed
				console.log('restaurant info will return from fetch');
				return (
					fetch(fetchEvent.request)
					.then(fetchResponse => fetchResponse.json())
					.then(json => {
						return idbPromise.then(db => {
							// new transaction
							let tx = db.transaction('restaurants', 'readwrite');
							// select store
							let store = tx.objectStore('restaurants');
							// write json to the idb store
							store.put({
								id: id,
								data: json
							});
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
			console.log('error in handleAPIRequest: ', error);
			return new Response('Something went terribly wrong!', {
				status: 500
			});
		})
	);
}

const handleReviewRequest = (fetchEvent) => {
	debugger;
	fetchEvent.respondWith(
		idbPromise
		.then(idb => {
			// first attempt to get review from idb
			return idb
				.transaction("reviews").objectStore("reviews")
				.index("byrestaurantid")
				.getAll(id);
		}).then(data => {
			// return the retrieved data
			// if it's not there, try a fetch
			return (data.length && data) || fetch(fetchEvent.request)
				// convert to json
				.then(fetchResponse => fetchResponse.json())

				.then(data => {
					// write json into idb reviews store
					return idbPromise.then(idb => {
						// new transaction
						const tx = idb.transaction("reviews", "readwrite");
						const store = tx.objectStore("reviews");
						data.forEach(review => {
							// place each in the store by id
							store.put({
								id: review.id,
								"byrestaurantid": review["byrestaurantid"],
								data: review
							});
						})
						return data;
					})
				})
		}).then(response => {
			// look for data object on the response
			if (response[0].data) {
				// convert data using map method
				const mappedResponse = response.map((review) => review.data);
				// have to return a new response object
				return new Response(JSON.stringify(mappedResponse));
			}
			// if there is no .data return the json version of the original response 
			return new Response(JSON.stringify(response));
		}).catch(error => {
			return new Response("Oh Crud, there was an error", {
				status: 500
			})
		})
	);
}