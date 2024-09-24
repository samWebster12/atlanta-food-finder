let map;
let markers = [];
let userLocation;


var btn = document.getElementById("startButton");

// When the user clicks the button, open the modal 
btn.onclick = function() {
    modal.style.display = "block";
}

function initMap() {
    const atlanta = { lat: 33.7490, lng: -84.3880 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: atlanta,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log("User location:", userLocation);
            },
            error => {
                console.error("Error getting user location:", error);
                alert("Unable to retrieve your location.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function searchRestaurants() {
    const query = document.getElementById('search-input').value;
    const maxDistanceMiles = document.getElementById('distanceFilter').value; // Get distance in miles
    const maxDistance = maxDistanceMiles ? maxDistanceMiles * 1.60934 : Infinity; // Convert to kilometers
    const minRating = parseFloat(document.getElementById('ratingFilter').value) || 0;


    if (!userLocation) {
        alert("User location not available.");
        return;
    }

    console.log("SEARCHING RESTAURANTS: " + query);
    fetch(`/search/?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            clearMarkers();
            console.log("DATA BEFORE FILTERS: ", data)
            const filteredRestaurants = data.restaurants.filter(restaurant => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    restaurant.lat,
                    restaurant.lng
                );
                
                // Check if rating is present and valid
                const rating = parseFloat(restaurant.rating) || 0; // Ensure rating is a number
                return distance <= maxDistance && rating >= minRating; 
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

window.onload = initMap;