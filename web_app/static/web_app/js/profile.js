document.addEventListener('DOMContentLoaded', function() {
    initFavorites();
    initProfile();
});

async function initProfile() {
    try {
        const response = await fetch('/api/get_profile');
        const data = await response.json();
        console.log(data)
        const profileName = document.querySelector('#profile-name');
        const profileEmail = document.querySelector('#profile-email');

        profileName.textContent = data.username;
        profileEmail.textContent = data.email;
    } catch (error) {
        console.error('Error fetching profile:', error);
        document.querySelector('#profile').innerHTML = '<p>Error loading profile. Please try again later.</p>';
    }
}

async function initFavorites() {
    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        const favorites = data.favorites;  // Access the favorites array from the response
        const favoritesList = document.querySelector('#favorites-list');

        // Clear any existing content
        favoritesList.innerHTML = '';

        // Check if favorites is an array and has items
        if (Array.isArray(favorites) && favorites.length > 0) {
            // Use Promise.all to fetch all favorite details concurrently
            const favoriteDetails = await Promise.all(
                favorites.map(favorite => fetch(`/api/place-details/?place_id=${favorite.place_id}`).then(res => res.json()))
            );
            
            favoriteDetails.forEach(detail => {
                console.log(detail);
                const card = createRestaurantCard(detail);
                favoritesList.appendChild(card);
            });
        } else {
            favoritesList.innerHTML = '<p>No favorites found.</p>';
        }
    } catch (error) {
        console.error('Error fetching favorites:', error);
        document.querySelector('#favorites-list').innerHTML = '<p>Error loading favorites. Please try again later.</p>';
    }
}

function createRestaurantCard(restaurant) {
    const starRating = '★'.repeat(Math.round(restaurant.rating)) + '☆'.repeat(5 - Math.round(restaurant.rating));
    const priceLevel = '$'.repeat(restaurant.price_level || 0);
    
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.innerHTML = `
        <div class="restaurant-summary">
            <div class="restaurant-image">
                <img src="${restaurant.photos && restaurant.photos[0] ? `/api/proxy-photo/?photo_reference=${restaurant.photos[0].photo_reference}` : '/static/web_app/images/pasta_placeholder.jpg'}" alt="${restaurant.name}">
            </div>
            <div class="restaurant-info">
                <h2 class="restaurant-name">${restaurant.name} <span class="price">${priceLevel}</span></h2>
                <div class="rating">
                    <span class="stars">${starRating}</span>
                    <span class="rating-text">${restaurant.rating}/5.0</span>
                </div>
                <p class="address">${restaurant.vicinity || restaurant.formatted_address}</p>
                <p class="hours"><span class="${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'open' : 'closed'}">
                    ${restaurant.opening_hours && restaurant.opening_hours.open_now ? 'Open' : 'Closed'}</span></p>
                <p class="restaurant-type">${restaurant.types[0].replace(/_/g, ' ').charAt(0).toUpperCase() + restaurant.types[0].replace(/_/g, ' ').slice(1)}</p>
            </div>
        </div>
    `;
    return card;
}