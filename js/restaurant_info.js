let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
	initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {      
			self.newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoiZmxhdm9yZGF2ZTg4IiwiYSI6ImNqaXMwdGtqcTA1bmgzcWxnc3M2eHljYmEifQ.BkDZ94zleVJZ0GXeHyUHiw',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
					'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
					'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'    
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		}
	});
}  
 
/* window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant)
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	//debugger;
	const isFavorite = typeof restaurant.is_favorite !== "undefined" && restaurant.is_favorite ? true : false;
	const favorite = document.getElementById('restaurant-favorite');
	favorite.dataset.state = isFavorite;
	favorite.innerHTML = isFavorite ? `${restaurant.name} is a favorite restaurant` : `${restaurant.name} is not a favorite restaurant`;
	favorite.addEventListener('click',event => {
		// toggle element state
		favorite.dataset.state = isFavorite ? false : true;

		// if online, make call to api
		if(navigator.onLine){
			// fetch
			// http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
		}else{
		// if offline, update cache and add api call to queque

		}

		

	});

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img'
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	if(typeof restaurant.photograph === "undefined"){
		image.srcset = `https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/small/no-photo.jpg 300w, 
						https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/medium/no-photo.jpg 600w,
						https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/large/no-photo-banner.jpg 800w`;
		image.alt = 'no photograph available for ' + restaurant.name;
	}else{
		image.srcset = `https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/small/${restaurant.photograph}.jpg 300w, 
						https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/medium/${restaurant.photograph}.jpg 600w,
						https://davidgailey.github.io/mws-restaurant-stage-1/dist/img/large/${restaurant.photograph}.jpg 800w`;
		image.alt = 'promotional photograph for ' + restaurant.name;
	}

	// <img  src="images/great_pic_800.jpg"
	//     sizes="(max-width: 400px) 100vw, (min-width: 401px) 50vw"
	//     srcset="images/great_pic_400.jpg 400w, images/great_pic_800.jpg 800w"
	//     alt="great picture">

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	//let count = 0;
	for (let key in operatingHours) {
		let row = document.createElement('tr');
		//row.setAttribute('className',count%2);

		let day = document.createElement('td');
		day.className = 'day';
		day.innerHTML = key;
		row.appendChild(day);

		let time = document.createElement('td');
		time.className = 'time';
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h3');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	li.appendChild(name);

	const date = document.createElement('p');
	date.innerHTML = review.date;
	li.appendChild(date);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: `;
	for (let i = 1; i <= 5; i++) {
		if(i <= review.rating){ 
			rating.innerHTML += '★';
		}else{
			rating.innerHTML += '☆';
		} 
	}
	//rating.innerHTML = `Rating: ${review.rating} / 5`;
	li.appendChild(rating);

	li.appendChild(document.createElement('hr'));

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.setAttribute("aria-current","page");
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
