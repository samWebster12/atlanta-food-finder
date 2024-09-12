from django.shortcuts import render
from django.http import JsonResponse
import requests

def index(request):
    return render(request, 'index.html')


def search_restaurants(request):
    print("receievd request")
    query = request.GET.get('query', '')
    # You'll need to set up your API key in your Django settings
    api_key = 'AIzaSyDRbtKq5nh6cpCD_HVe09TqO7nuZEttfUk'

    url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    params = {
        'location': '33.7490,-84.3880',  # Coordinates for Atlanta
        'radius': '5000',  # Search within 5km
        'type': 'restaurant',
        'keyword': query,
        'key': api_key
    }
    
    response = requests.get(url, params=params)
    results = response.json().get('results', [])
    
    restaurants = []
    for result in results:
        restaurants.append({
            'name': result['name'],
            'lat': result['geometry']['location']['lat'],
            'lng': result['geometry']['location']['lng'],
        })
    
    return JsonResponse({'restaurants': restaurants})