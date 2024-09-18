from django.shortcuts import render
from django.http import JsonResponse
import requests
import json

USE_DUMMY_DATA = True

def index(request):
    return render(request, 'map.html')


def search_restaurants(request):
    if USE_DUMMY_DATA == False:
        query = request.GET.get('query', '')
        # You'll need to set up your API key in your Django settings
        api_key = 'AIzaSyDRbtKq5nh6cpCD_HVe09TqO7nuZEttfUk'

        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': '33.7490,-84.3880',  # Coordinates for Atlanta
            'radius': '24140.16',  # Search within 15 miles
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
                'rating': result.get('rating', 0)
            })
        
        return JsonResponse({'restaurants': restaurants})
    
    else:
        file_path = "dummy_maps_results.json"
        with open(file_path, 'r') as json_file:
            results = json.load(json_file)

        restaurants = []
        for result in results:
            restaurants.append({
                'name': result['name'],
                'lat': result['geometry']['location']['lat'],
                'lng': result['geometry']['location']['lng'],
            })
        
        return JsonResponse({'restaurants': restaurants})
