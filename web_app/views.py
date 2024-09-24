from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json
import requests
USE_DUMMY_DATA = True


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
            return JsonResponse({'Success': True})
        else:
            return JsonResponse({'Success': False})
    return render(request, 'index.html', {'action', 'login'})


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
            user = User.objects.create_user(username, email, password)  # Make User model
            login(request, user)
            return JsonResponse({'Success': True})
        except:
            return JsonResponse({'Success': False})
    return render(request, 'index.html', {'action', 'signup'})


@require_GET
def search_restaurants(request):
    if USE_DUMMY_DATA == False:
        query = request.GET.get('query', '')

        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': '33.7490,-84.3880',  # Coordinates for Atlanta
            'radius': '24140.16',  # Search within 15 miles
            'type': 'restaurant',
            'keyword': query,
            'key': settings.GOOGLE_MAPS_API_KEY
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


@require_GET
def get_place_details(request):
    place_id = request.GET.get('place_id')
    if not place_id:
        return JsonResponse({'error': 'place_id is required'}, status=400)

    api_key = settings.GOOGLE_MAPS_API_KEY
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,rating,formatted_phone_number,formatted_address,opening_hours,website&key={api_key}"

    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'OK':
            return JsonResponse(data['result'])
        else:
            return JsonResponse({'error': 'Unable to fetch place details'}, status=400)
    else:
        return JsonResponse({'error': 'API request failed'}, status=response.status_code)