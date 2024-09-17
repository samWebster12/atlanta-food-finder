from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json
import requests

def index(request):
    return render(request, 'index.html')

@csrf_exempt
def login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data['username']
        password = data['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({True})
        else:
            return JsonResponse({False})
@csrf_exempt
def logout(request):
    logout(request)
    return JsonResponse({True})

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data['username']
        password = data['password']
        email = data['email']
        try:
            user = User.objects.create_user(username, email, password) #Make User model
            login(request, user)
            return JsonResponse({True})
        except:
            return JsonResponse({False})
def search_restaurants(request):
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
        moreDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json'
        moreDetailsParams = {
            'place-id': result['place-id'],
            'fields': 'name,rating,address,phone_number,website,reviews, rating, opening_hours, closing_hours, price_level',
            'key': api_key
        }
        moreDetailsResponse = requests.get(moreDetailsUrl, params=moreDetailsParams)
        moreDetails = moreDetailsResponse.json().get('results', [])
        restaurants.append({
            'name': moreDetails.get('name'),
            'address': moreDetails.get('address'),
            'phone': moreDetails.get('phone_number'),
            'website': moreDetails.get('website'),
            'reviews': moreDetails.get('reviews', [])[:3],
            'rating': moreDetails.get('rating'),
            'opening_hours': moreDetails.get('opening_hours', {}).get('text'),
            'closing_hours': moreDetails.get('closing_hours', {}).get('text'),
            'price_level': moreDetails.get('price_level'),
            'lat': result['geometry']['location']['lat'],
            'lng': result['geometry']['location']['lng'],
        })
    
    return JsonResponse({'restaurants': restaurants})