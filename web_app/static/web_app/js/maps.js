let map;
let markers = [];

function initMap() {
    const atlanta = { lat: 33.7490, lng: -84.3880 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: atlanta,
    });
}

function searchRestaurants() {
    const query = document.getElementById('search-input').value;
    console.log("SEARCHING RESTAURANTS: " + query);
    fetch(`/search/?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            clearMarkers();
            console.log("DATA: ", data)
            data.restaurants.forEach(restaurant => {
                addMarker(restaurant);
            });
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

window.onload = initMap;