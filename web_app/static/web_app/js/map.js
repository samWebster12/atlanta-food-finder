let map;
let markers = [];

//Atlanta
let userLocation = {
    lat: 33.7490,
    lng: -84.3880
};

document.addEventListener('DOMContentLoaded', function() {
    
    initMap();
    initEventListeners();
});

function initMap() {
    const atlanta = { lat: 33.7490, lng: -84.3880 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: atlanta,
    });
    console.log("Map initialized");
}

function initEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            handleSearch(searchInput.value);
        });
    } else {
        console.error("Search button not found");
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                handleSearch(searchInput.value);
            }
        });
    } else {
        console.error("Search input not found");
    }
}

async function handleSearch(searchInput) {
    console.log("Search input: " + searchInput);
    if (searchInput.trim() === '') {
        alert('Please enter a valid search input');
        return;
    }

    const distanceFilter = document.getElementById('distance-filter').value;
    const ratingsFilter = document.getElementById('ratings-filter').value;
    const searchBy = document.getElementById('search-by').value;

    const restaurants = await getRestaurants(searchInput, distanceFilter, ratingsFilter, searchBy);
    if (restaurants.length > 0 && searchBy == 'location') {
        userLocation = {
            lat: restaurants[0].geometry.location.lat,
            lng: restaurants[0].geometry.location.lng
        };

        map.setCenter(userLocation);

        // Set the zoom based on distanceFilter
        const zoomLevel = getZoomLevelFromDistance(distanceFilter);
        map.setZoom(zoomLevel);
    }

    displayRestaurants(restaurants);
}


function getZoomLevelFromDistance(distance) {
    // Parse distance to integer in case it's a string
    const parsedDistance = parseInt(distance, 10);

    switch (parsedDistance) {
        case 5:
            return 13; // Zoom into neighborhood level
        case 10:
            return 12; // Zoom into city level
        case 20:
            return 12; // Zoom out to larger area
        case 30:
        default:
            return 11;  // Default zoom level for larger distances
    }
}
async function getRestaurants(query, distanceFilter, ratingsFilter, searchBy) {
    if (!userLocation) {
        alert("User location not available.");
        return [];
    }

    try {
        const response = await fetch(`/api/search/?query=${encodeURIComponent(query)}&search_by=${encodeURIComponent(searchBy)}&distance_filter=${encodeURIComponent(distanceFilter)}`);
        const data = await response.json();
        clearMarkers();

        console.log(data)
        
        console.log("Raw data from server:", data);

        const filteredRestaurants = data.restaurants.filter(restaurant => {            
            const minRating = parseFloat(ratingsFilter) || 0;
            const rating = parseFloat(restaurant.rating) || 0;
        
            return rating >= minRating;
        });

        console.log("Filtered restaurants:", filteredRestaurants);
        return filteredRestaurants;
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        alert("An error occurred while fetching restaurants. Please try again.");
        return [];
    }
}

async function createRestaurantCard(restaurant) {
    const starRating = '★'.repeat(Math.round(restaurant.rating)) + '☆'.repeat(5 - Math.round(restaurant.rating));
    const priceLevel = '$'.repeat(restaurant.price_level || 0);
    
    let bookmarkHTML = '';
    console.log("IS LOGGED IN: " + isLoggedIn);

    // Check if the restaurant is a favorite
    let isFavorite = false;
    if (isLoggedIn) {
        isFavorite = await checkFavorite(restaurant.place_id);
        bookmarkHTML = `
            <div class="bookmark" onclick="toggleBookmark(this)">
                <i class="${isFavorite ? 'fas' : 'far'} fa-bookmark"></i>
            </div>
        `;
    }

    const cardHTML = `
        <div class="restaurant-card" data-place-id="${restaurant.place_id}">
            <div class="restaurant-summary">
                <div class="restaurant-image">
                    <img src="${restaurant.photos && restaurant.photos[0] ? `/api/proxy-photo/?photo_reference=${restaurant.photos[0].photo_reference}` : '/static/web_app/images/pasta_placeholder.jpg'}" alt="${restaurant.name}">
                </div>
                <div class="restaurant-info">
                    <h2 class="restaurant-name">${restaurant.name} <span class="price">${priceLevel}</span></h2>
                    <div class="rating">
                        <span class="stars">${starRating}</span>
                        <span class="rating-text">${restaurant.rating}/5.0 (${restaurant.user_ratings_total} Reviews)</span>
                    </div>
                    <p class="address">${restaurant.vicinity || restaurant.formatted_address}</p>
                    <p class="hours"><span class="${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'open' : 'closed'}">
                        ${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'Open' : 'Closed'}</span></p>
                    <p class="restaurant-type">${restaurant.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + restaurant.types[0].replace(/_/g, ' ').slice(1)}</p>
                </div>
                ${bookmarkHTML}  <!-- Conditionally display the bookmark if logged in -->
            </div>
            <div class="restaurant-details" style="display: none;">
                <div class="details-content"></div>
            </div>
        </div>
    `;

    return cardHTML;
}

function toggleBookmark(bookmarkElement) {
    const icon = bookmarkElement.querySelector('i');
    const card = bookmarkElement.closest('.restaurant-card'); // Find the closest parent card
    const placeId = card.getAttribute('data-place-id'); // Get the place_id from the card

    if (icon.classList.contains('far')) {
        icon.classList.remove('far', 'fa-bookmark');
        icon.classList.add('fas', 'fa-bookmark');

        // Send a request to the backend to add this restaurant as a favorite
        addFavorite(placeId);
    } else {
        icon.classList.remove('fas', 'fa-bookmark');
        icon.classList.add('far', 'fa-bookmark');
        
        // Optionally: You can implement a "remove from favorites" function here
        removeFavorite(placeId);
    }
}

async function checkFavorite(placeId) {
    try {
        const response = await fetch(`/api/check_favorite?place_id=${placeId}`, {
            method: 'GET',
        });

        const data = await response.json();
        if (data.success) {
            return data.is_favorite;
        } else {
            console.error('Failed to check favorite:', data.error);
            return false;
        }
    } catch (error) {
        console.error('Error checking favorite:', error);
        return false;
    }
}

async function addFavorite(placeId) {
    try {
        const response = await fetch(`/api/add_favorite?place_id=${placeId}`, {
            method: 'GET',  // Using GET as per your request (POST is more conventional for adding data)
        });

        const data = await response.json();
        if (data.success) {
            console.log(`Added place ID ${placeId} to favorites.`);
        } else {
            console.error('Failed to add favorite:', data);
            alert('Failed to add favorite. Please try again.');
        }
    } catch (error) {
        console.error('Error adding favorite:', error);
        alert('Error adding favorite. Please try again.');
    }
}

async function removeFavorite(placeId) {
    try {
        const response = await fetch(`/api/remove_favorite?place_id=${placeId}`, {
            method: 'GET',  // Using GET for simplicity (but POST or DELETE is more conventional for removal)
        });

        const data = await response.json();
        if (data.success) {
            console.log(`Removed place ID ${placeId} from favorites.`);
        } else {
            console.error('Failed to remove favorite:', data.message || data.error);
            alert(data.message || 'Failed to remove favorite. Please try again.');
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Error removing favorite. Please try again.');
    }
}


async function expandRestaurantCard(card) {
    const placeId = card.dataset.placeId;
    const detailsSection = card.querySelector('.restaurant-details');
    const detailsContent = card.querySelector('.details-content');

    if (detailsSection.style.display === 'none') {
        // Expand the card
        detailsSection.style.display = 'block';
        card.classList.add('expanded');

        if (!detailsContent.innerHTML.trim()) {
            detailsContent.innerHTML = '<p class="loading">Loading details...</p>';
            try {
                const response = await fetch(`/api/place-details/?place_id=${placeId}`);
                const details = await response.json();
                const formattedAddress = encodeURIComponent(details.formatted_address || '');

                let contentHTML = `
                    <div class="details-grid">
                        <div class="contact-info">
                            <h3>Contact</h3>
                            <p><i class="fas fa-phone"></i> ${details.formatted_phone_number || 'N/A'}</p>
                            <p><i class="fas fa-globe"></i> ${details.website ? `<a href="${details.website}" target="_blank">Website</a>` : 'N/A'}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${details.formatted_address || 'N/A'}</p>
                        </div>
                        <div class="hours-info">
                            <h3>Hours</h3>
                            <ul class="hours-list">
                                ${details.opening_hours ? details.opening_hours.weekday_text.map(day => `<li>${day}</li>`).join('') : '<li>N/A</li>'}
                            </ul>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <a class="action-btn directions" href="https://www.google.com/maps/dir/?api=1&destination=${formattedAddress}" target="_blank">
                            <i class="fas fa-directions"></i> Get Directions
                        </a>
                    </div>
                    <div class="reviews-section">
                        <h3>Reviews</h3>
                        <div id="reviews-container">
                        </div>
                        ${createReviewForm(placeId)}
                </div>
                `;

                if (details.reviews && details.reviews.length > 0) {
                    contentHTML += `
                        <div class="reviews-section">
                            <h3>Top Reviews</h3>
                            <div class="reviews-grid">
                                ${details.reviews.slice(0, 3).map(review => `
                                    <div class="review-card">
                                        <div class="review-header">
                                            <span class="review-author">${review.author_name}</span>
                                            <span class="review-rating">${'★'.repeat(review.rating)}</span>
                                        </div>
                                        <p class="review-text">"${review.text}"</p>
                                        <p class="review-time">${new Date(review.time * 1000).toLocaleDateString()}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }

                detailsContent.innerHTML = contentHTML;
                await loadReviews(placeId);
                setupReviewForm();
            } catch (error) {
                detailsContent.innerHTML = '<p class="error">Failed to load details. Please try again.</p>';
                console.error('Error fetching place details:', error);
            }
        }
    } else {
        // Collapse the card
        detailsSection.style.display = 'none';
        card.classList.remove('expanded');
    }
}

async function displayRestaurants(restaurants) {
    const resultsContainer = document.querySelector('.results');
    resultsContainer.innerHTML = '<h1 class="results-header">Results</h1>'; // Clear previous results

    // Create an array of promises for each restaurant card
    const restaurantCardPromises = restaurants.map(async restaurant => {
        const imageUrl = restaurant.photos && restaurant.photos[0]
            ? `/api/proxy-photo/?photo_reference=${restaurant.photos[0].photo_reference}`
            : '{% static "web_app/images/pasta_placeholder.jpg" %}';

        // Wait for the async createRestaurantCard function
        const card = await createRestaurantCard(restaurant);
        addMarker(restaurant, imageUrl);  // Keep this sync as markers can be added without waiting
        return card;  // Return the created card
    });

    // Wait for all restaurant cards to be created
    const restaurantCards = await Promise.all(restaurantCardPromises);

    // Insert each card into the DOM
    restaurantCards.forEach(card => {
        resultsContainer.insertAdjacentHTML('beforeend', card);
    });

    // Add click listeners to the cards
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.addEventListener('click', function(event) {
            // Prevent expansion when clicking on action buttons
            if (!event.target.closest('.action-buttons')) {
                expandRestaurantCard(this);
            }
        });
    });
}

function addMarker(restaurant, imageUrl) {
    const lat = restaurant.geometry?.location?.lat;
    const lng = restaurant.geometry?.location?.lng;
        
    if (lat === undefined || lng === undefined) {
        console.error("Latitude or longitude is undefined for restaurant:", restaurant.name);
        return;
    }
    
    const numLat = Number(lat);
    const numLng = Number(lng);
    
    if (isNaN(numLat) || isNaN(numLng)) {
        console.error("Invalid coordinates for marker:", restaurant.name, numLat, numLng);
        return;
    }
    
    try {
        const marker = new google.maps.Marker({
            position: { lat: numLat, lng: numLng },
            map: map,
            title: restaurant.name
        });
        
        markers.push(marker);
        
        // Create star rating
        const starRating = '★'.repeat(Math.round(restaurant.rating)) + '☆'.repeat(5 - Math.round(restaurant.rating));
        
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="width: 300px; font-family: Arial, sans-serif; background-color: #fff; overflow: hidden;">
                    <img src="${imageUrl}" alt="${restaurant.name}" style="width: 100%; height: 150px; object-fit: cover;">
                    <div style="padding: 15px 20px 20px;">
                        <h3 style="margin: 0 0 10px; color: #1a1a1a; font-size: 18px;">${restaurant.name}</h3>
                        <p style="margin: 5px 0; font-size: 14px;">
                            <span style="color: #ffd700;">${starRating}</span> 
                            <span style="color: #4a4a4a;">${restaurant.rating} (${restaurant.user_ratings_total} reviews)</span>
                        </p>
                        <p style="margin: 5px 0; font-size: 14px; color: #4a4a4a;">${restaurant.vicinity || 'N/A'}</p>
                        ${restaurant.opening_hours ? 
                            `<p style="margin: 5px 0; font-size: 14px; color: ${restaurant.opening_hours.open_now ? '#4CAF50' : '#F44336'}; font-weight: bold;">
                                ${restaurant.opening_hours.open_now ? 'Open now' : 'Closed'}
                            </p>` : ''
                        }
                        <div style="margin-top: 15px;">
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}" target="_blank" style="text-decoration: none; color: #1a73e8; font-size: 14px; font-weight: 500;">Get Directions</a>
                        </div>
                    </div>
                </div>
            `,
            pixelOffset: new google.maps.Size(0, -20),
            disableAutoPan: false,
            maxWidth: 300 // Ensures the InfoWindow doesn't expand beyond our content width
        });
        
        // Remove default InfoWindow background
        infoWindow.setOptions({
            backgroundColor: 'transparent',
            padding: '0'
        });
        
        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });
    } catch (error) {
        console.error("Error creating marker for restaurant:", restaurant.name, error);
    }
}
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}


// Fallback: If Google Maps API is loaded after our script
window.initMap = initMap;

function createReviewForm(placeId) {
    return `
        <form id="review-form" data-place-id="${placeId}">
            <select name="rating" required>
                <option value="">Select Rating</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
            </select>
            <textarea name="comment" required placeholder="Write your review here"></textarea>
            <button type="submit">Submit Review</button>
        </form>
    `;
}

async function loadReviews(placeId) {
    try {
        const response = await fetch(`/api/get_reviews/?place_id=${placeId}`);
        const data = await response.json();
        const reviews = data.reviews;

        if (reviews.length === 0) {
            document.getElementById('reviews-container').innerHTML = '<p>There are no reviews at the time. You can be the first!</p>';
        } else {
            document.getElementById('reviews-container').innerHTML = reviews.map(review => `
                <div class="review">
                    <p><strong>${review.user}</strong> rated it ${review.rating} stars</p>
                    <p>${review.comment}</p>
                    <small>${new Date(review.created_at).toLocaleString()}</small>
                </div>
            `).join('');
        }
    } catch (error) {
        document.getElementById('reviews-container').innerHTML = '<p>Reviews failed to load. Try again shortly.</p>';
    }
}

function setupReviewForm() {
        if (!isLoggedIn) {
            document.getElementById('review-form').innerHTML = '<p>Please <a href="/login">log in</a> if you want to submit a review.</p>';
            return;
        }
        if(document.getElementById('review-form')){
            document.getElementById('review-form').addEventListener('click', function(event) {
            event.stopPropagation();
        });

        document.getElementById('review-form').querySelector('select').addEventListener('click', function(event) {
            event.stopPropagation();
        });

        document.getElementById('review-form').querySelector('textarea').addEventListener('click', function(event) {
            event.stopPropagation();
        });
        }
        document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fdata = new FormData(document.getElementById('review-form'));

        const reviewData = {
            place_id: document.getElementById('review-form').dataset.placeId,
            rating: fdata.get('rating'),
            comment: fdata.get('comment')
        };
        const csrftok = getCookie('csrftoken')

        try {
            const response = await fetch('/api/create_review/', {
                method: 'POST',
                body: JSON.stringify(reviewData),
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftok
                }
            });
            const data = await response.json();
            if (data.success) {
                alert('Review has been submitted!!');
                document.getElementById('review-form').reset();
                await loadReviews(document.getElementById('review-form').dataset.placeId);
            } else {
                alert('Review not submitted. Try again shortly.');
            }
        } catch (error) {
            alert('An error occurred. Please try again.');
        }
    });
}
function getCookie(name) {
    let val = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                val = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return val;
}
