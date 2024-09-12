let map;
let markers = [];
let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
});

function initMap() {
    const atlanta = { lat: 33.749, lng: -84.388 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: atlanta,
    });
}

function setupEventListeners() {
    document.getElementById('authButton').addEventListener('click', toggleAuth);
    document.getElementById('searchButton').addEventListener('click', performSearch);
    document.getElementById('ratingFilter').addEventListener('change', applyFilters);
    document.getElementById('distanceFilter').addEventListener('change', applyFilters);
}

function toggleAuth() {
    isLoggedIn = !isLoggedIn;
    const authButton = document.getElementById('authButton');
    const favoritesSection = document.getElementById('favorites-section');
    const profileSection = document.getElementById('profile-section');

    if (isLoggedIn) {
        authButton.textContent = 'Logout';
        favoritesSection.classList.remove('hidden');
        profileSection.classList.remove('hidden');
    } else {
        authButton.textContent = 'Login';
        favoritesSection.classList.add('hidden');
        profileSection.classList.add('hidden');
    }
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value;
    // Here you would typically make an API call to get search results
    // For this example, we'll use dummy data
    const dummyResults = [
        { name: 'Restaurant A', rating: 4.5, location: { lat: 33.749, lng: -84.388 } },
        { name: 'Restaurant B', rating: 3.8, location: { lat: 33.755, lng: -84.390 } },
        { name: 'Restaurant C', rating: 4.2, location: { lat: 33.760, lng: -84.385 } },
    ];
    displayResults(dummyResults);
    addMarkersToMap(dummyResults);
}

function displayResults(restaurants) {
    const restaurantList = document.getElementById('restaurantList');
    restaurantList.innerHTML = '';
    restaurants.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.innerHTML = `
            <h3>${restaurant.name}</h3>
            <p>Rating: ${restaurant.rating}</p>
            <button onclick="addToFavorites('${restaurant.name}')">Add to Favorites</button>
        `;
        restaurantList.appendChild(card);
    });
}

function addMarkersToMap(restaurants) {
    clearMarkers();
    restaurants.forEach(restaurant => {
        const marker = new google.maps.Marker({
            position: restaurant.location,
            map: map,
            title: restaurant.name
        });
        markers.push(marker);
    });
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

function applyFilters() {
    const ratingFilter = document.getElementById('ratingFilter').value;
    const distanceFilter = document.getElementById('distanceFilter').value;
    // Here you would typically make an API call with the filter parameters
    // For this example, we'll just log the filter values
    console.log(`Applying filters: Rating > ${ratingFilter}, Distance < ${distanceFilter} miles`);
    performSearch(); // Re-run search with filters
}

function addToFavorites(restaurantName) {
    if (!isLoggedIn) {
        alert('Please log in to add favorites');
        return;
    }
    // Here you would typically make an API call to save the favorite
    // For this example, we'll just log it
    console.log(`Added ${restaurantName} to favorites`);
}