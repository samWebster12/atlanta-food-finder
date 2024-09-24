from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import requests

def index(request):
    return render(request, 'index.html')


def search_restaurants(request):
    print("received request")
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

def login_view(request):
    return render(request, 'login.html')

def ask_account(request):
    return render(request, 'account.html')

def create_account(request):
    return render(request, 'acc-create.html')

def back_home(request):
    return render(request, 'index.html')