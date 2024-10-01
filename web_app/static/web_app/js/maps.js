let map;
let markers = [];

//Atlanta
let userLocation = {
    lat: 33.7490,
    lng: -84.3880
};
let isLoggedIn = false;

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

function createRestaurantCard(restaurant, imageUrl) {
    const starRating = '★'.repeat(Math.round(restaurant.rating)) + '☆'.repeat(5 - Math.round(restaurant.rating));
    const priceLevel = '$'.repeat(restaurant.price_level || 0);
    
    const cardHTML = `
        <div class="restaurant-card" data-place-id="${restaurant.place_id}">
            <div class="restaurant-summary">
                <div class="restaurant-image">
                    <img src="${imageUrl}" alt="${restaurant.name}" onerror="this.src='{% static "web_app/images/pasta_placeholder.jpg" %}'">
                </div>
                <div class="restaurant-info">
                    <h2 class="restaurant-name">${restaurant.name} <span class="price">${priceLevel}</span></h2>
                    <div class="rating">
                        <span class="stars">${starRating}</span>
                        <span class="rating-text">${restaurant.rating}/5.0 (${restaurant.user_ratings_total} Reviews)</span>
                    </div>
                    <p class="address">${restaurant.vicinity}</p>
                    <p class="hours"><span class="${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'open' : 'closed'}">
                        ${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'Open' : 'Closed'}</span></p>
                    <p class="restaurant-type">${restaurant.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + restaurant.types[0].replace(/_/g, ' ').slice(1)}</p>
                </div>
                <div class="bookmark" onclick="toggleBookmark(this)">
                    <i class="far fa-bookmark"></i>
                </div>
            </div>
            <div class="restaurant-details" style="display: none;">
                <div class="details-content">

                </div>
            </div>
        </div>
    `;

    return cardHTML;
}

function toggleBookmark(bookmarkElement) {
    const icon = bookmarkElement.querySelector('i');

    if (icon.classList.contains('far')) {
        icon.classList.remove('far', 'fa-bookmark');
        icon.classList.add('fas', 'fa-bookmark');
    } else {
        icon.classList.remove('fas', 'fa-bookmark');
        icon.classList.add('far', 'fa-bookmark');
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

        // Fetch and display additional details if not already loaded
        if (!detailsContent.innerHTML.trim()) {
            console.log('Fetching details for place:', placeId);
            detailsContent.innerHTML = '<p style="text-align: center; color: #FFD700;">Loading details...</p>';
            try {
                // Fetch logic here (replace with your API endpoint)
                const response = await fetch(`/api/place-details/?place_id=${placeId}`);
                const details = await response.json();
                const formattedAddress = encodeURIComponent(details.formatted_address || '');

                console.log('Details:', details);

                // Building the content
                let contentHTML = `
                    <div class="info-section">
                        <div class="contact-section">
                            <div>
                                <h4>Contact</h4>
                                <p>📞 ${details.formatted_phone_number || 'N/A'}</p>
                                <p>🌐 ${details.website ? `<a href="${details.website}" target="_blank">Website</a>` : 'N/A'}</p>
                            </div>
                            <div>
                                <h4>Address</h4>
                                <p>📍 ${details.formatted_address || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="hours-section">
                            <h4>Hours</h4>
                            <ul class="hours-list">
                                ${details.opening_hours ? details.opening_hours.weekday_text.map(day => `<li>${day}</li>`).join('') : '<li>N/A</li>'}
                            </ul>
                        </div>
                        <div class="action-buttons">
                        <a class="action-btn directions" href="https://www.google.com/maps/dir/?api=1&destination=${formattedAddress}" target="_blank">
                            <svg viewBox="0 0 24 24" class="icon">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            DIRECTIONS
                        </a>
                    </div>
                    </div>
                `;

                // Check if there are reviews
                if (details.reviews && details.reviews.length > 0) {
                    const reviews = details.reviews.slice(0, 3);  // Get first 3 reviews or less

                    contentHTML += `
                        <div class="reviews-section">
                            <h4>Reviews</h4>
                            <ul class="reviews-list">
                    `;

                    reviews.forEach(review => {
                        const formattedTime = new Date(review.time * 1000).toLocaleDateString();
                        contentHTML += `
                            <li class="review-item">
                                <p><strong>${review.author_name}</strong> <span class="review-rating">Rating: ${'★'.repeat(review.rating)}</span></p>
                                <p class="review-text">"${review.text}"</p>
                                <p class="review-time">${formattedTime}</p>
                            </li>
                        `;
                    });

                    contentHTML += `
                            </ul>
                        </div>
                    `;
                }

                // Update the inner HTML with the new content
                detailsContent.innerHTML = contentHTML;

            } catch (error) {
                detailsContent.innerHTML = '<p style="text-align: center; color: #FFD700;">Failed to load details. Please try again.</p>';
                console.error('Error fetching place details:', error);
            }
        }
    } else {
        // Collapse the card
        detailsSection.style.display = 'none';
        card.classList.remove('expanded');
    }
}

function displayRestaurants(restaurants) {
    const resultsContainer = document.querySelector('.results');
    resultsContainer.innerHTML = '<h1 class="results-header">Results</h1>'; // Clear previous results

    restaurants.forEach(restaurant => {
        const imageUrl = restaurant.photos && restaurant.photos[0]
        ? `/api/proxy-photo/?photo_reference=${restaurant.photos[0].photo_reference}`
        : '{% static "web_app/images/pasta_placeholder.jpg" %}';

        const card = createRestaurantCard(restaurant, imageUrl);
        addMarker(restaurant, imageUrl);
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

function adjustContainerHeights() {
    if (window.innerWidth > 768) { // Not mobile
        const headerHeight = document.querySelector('.header').offsetHeight;
        const searchContainerHeight = document.querySelector('.search-container').offsetHeight;
        const bottomContent = document.querySelector('.bottom-content');
        const availableHeight = window.innerHeight - headerHeight - searchContainerHeight;
        bottomContent.style.height = `${availableHeight}px`;
    } else {
        document.querySelector('.bottom-content').style.height = 'auto';
    }
}

// Call on page load and window resize
window.addEventListener('load', adjustContainerHeights);
window.addEventListener('resize', adjustContainerHeights);

// Fallback: If Google Maps API is loaded after our script
window.initMap = initMap;