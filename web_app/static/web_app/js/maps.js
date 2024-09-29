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

function handleSearch(searchInput) {
    console.log("Search input: " + searchInput);
    if (searchInput.trim() === '') {
        alert('Please enter a valid search input');
        return;
    }

    const distanceFilter = document.getElementById('distance-filter').value;
    const ratingsFilter = document.getElementById('ratings-filter').value;
    const searchBy = document.getElementById('search-by').value;

    searchRestaurants(searchInput, distanceFilter, ratingsFilter, searchBy);
}

function searchRestaurants(query, distanceFilter, ratingsFilter, searchBy) {
    if (!userLocation) {
        alert("User location not available.");
        return;
    }

    console.log("SEARCHING RESTAURANTS: " + query);
    fetch(`/search/?query=${encodeURIComponent(query)}&search_by=${encodeURIComponent(searchBy)}&distance_filter=${encodeURIComponent(distanceFilter)}`)
        .then(response => response.json())
        .then(data => {
            clearMarkers();
            console.log("DATA BEFORE FILTERS: ", data)

            const filteredRestaurants = data.restaurants.filter(restaurant => {
                // Calculate distance in kilometers
                const distanceKm = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    restaurant.lat,
                    restaurant.lng
                );
                
                // Convert distance to miles (1 km ≈ 0.621371 miles)
                const distanceMiles = distanceKm * 0.621371;
                
                // Parse the rating and distance filter values
                const minRating = parseFloat(ratingsFilter) || 0;
                const maxDistanceMiles = parseFloat(distanceFilter) || Infinity;
            
                // Check if rating is present and valid
                const rating = parseFloat(restaurant.rating) || 0;
            
                return distanceMiles <= maxDistanceMiles && rating >= minRating;
            });

            filteredRestaurants.forEach(restaurant => {
                addMarker(restaurant);
            });
            console.log("DATA AFTER FILTERS: ", filteredRestaurants);
        });
}


function addMarker(restaurant) {
    const marker = new google.maps.Marker({
        position: { lat: restaurant.lat, lng: restaurant.lng },
        map: map,
        title: restaurant.name
    });
    markers.push(marker);
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function calculateDistance(lat1, lng1, lat2, lng2){
    const R = 6371; 
    const dLat = degreesToRadians(lat2 - lat1);
    const dLng = degreesToRadians(lng2 - lng1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * 
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Fallback: If Google Maps API is loaded after our script
window.initMap = initMap;