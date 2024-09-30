from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.http import HttpResponse
from django.conf import settings
from django.urls import reverse_lazy
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.contrib.auth import authenticate, login, logout, forms
from django.contrib.auth.models import User
from django import forms
from .forms import CustomAuthenticationForm, CustomUserCreationForm
import json
import requests
import aiohttp
import asyncio
from asgiref.sync import sync_to_async
USE_DUMMY_DATA = False

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': True})
                return redirect('index')
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = CustomAuthenticationForm()
    return render(request, 'auth/login.html', {'form': form})


@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect('index')


def ask_account(request):
    return render(request, 'auth/account.html')

def create_account(request):
    return render(request, 'auth/acc-create.html')

def back_home(request):
    return render(request, 'index.html')

@require_GET
async def search_restaurants(request):
    if not USE_DUMMY_DATA:
        query = request.GET.get('query', '')
        search_by = request.GET.get('search_by', 'name')
        distance_filter = request.GET.get('distance_filter', '30')
        print(f"Query: {query}, Search by: {search_by}, Distance filter: {distance_filter}")

        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = await create_search_params(query, search_by, distance_filter)
        print("Params: ", params)

        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                data = await response.json()
                results = data.get('results', [])
        
        return JsonResponse({'restaurants': results})
    else:
        search_by = request.GET.get('search_by', '')
        print(f"Search by: {search_by}")
        file_path = "dummy_maps_results.json"
        
        results = await sync_to_async(read_json_file)(file_path)

        return JsonResponse({'restaurants': results})

async def create_search_params(query, search_by, distance_filter):
    params = {
        'location': '33.7490,-84.3880',  # Coordinates for Atlanta
        'radius': '48280.32',  # Search within 30 miles by default
        'key': settings.GOOGLE_MAPS_API_KEY
    }

    if search_by == 'name':
        params['name'] = query
    elif search_by == 'cuisine-type':
        params['keyword'] = query
    elif search_by == 'location':
        coords = await get_coordinates(query)
        if coords:
            params['location'] = coords
            params['keyword'] = 'restaurant'
        else:
            params['name'] = query
    else:
        return {}

    # Set distance filter
    distance_mapping = {
        '5': '8046.72', '10': '16093.4', '15': '24140.16',
        '20': '32186.9', '25': '40233.6', '30': '48280.32'
    }
    params['radius'] = distance_mapping.get(distance_filter, '48280.32')

    return params

async def get_coordinates(location):
    print(f"Getting coordinates for location: {location}")
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": location,
        "key": settings.GOOGLE_MAPS_API_KEY
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(base_url, params=params) as response:
                data = await response.json()
            
            if data["status"] == "OK" and data["results"]:
                result = data["results"][0]
                location = result["geometry"]["location"]
                lat, lng = location["lat"], location["lng"]
                
                print(f"Found coordinates for {location}: {lat}, {lng}")
                print(f"Formatted address: {result.get('formatted_address')}")
                
                return f"{lat},{lng}"
            else:
                print(f"Geocoding failed. Status: {data.get('status')}")
                return None
        except aiohttp.ClientError as e:
            print(f"Request to Geocoding API failed: {e}")
            return None
        except KeyError as e:
            print(f"Unexpected response structure: {e}")
            return None

def read_json_file(file_path):
    with open(file_path, 'r') as json_file:
        return json.load(json_file)
    
def proxy_place_photo(request):
    photo_reference = request.GET.get('photo_reference')
    max_width = request.GET.get('max_width', 400)
    
    if not photo_reference:
        return HttpResponse('No photo reference provided', status=400)
    
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth={max_width}&photoreference={photo_reference}&key={settings.GOOGLE_MAPS_API_KEY}"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        return HttpResponse(response.content, content_type=response.headers['Content-Type'])
    else:
        return HttpResponse('Failed to fetch image', status=response.status_code)

# Other views
@require_GET
async def get_place_details(request):
    place_id = request.GET.get('place_id')
    if not place_id:
        return JsonResponse({'error': 'place_id is required'}, status=400)

    api_key = settings.GOOGLE_MAPS_API_KEY
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=name,rating,reviews,formatted_phone_number,formatted_address,opening_hours,website&key={api_key}"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if data['status'] == 'OK':
                    return JsonResponse(data['result'])
                else:
                    return JsonResponse({'error': 'Unable to fetch place details'}, status=400)
            else:
                return JsonResponse({'error': 'API request failed'}, status=response.status)

# Synchronous views
def index(request):
    return render(request, 'index.html')

def map_view(request):
    return render(request, 'map.html')


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label = 'Email')
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'login-input'
            field.widget.attrs['placeholder'] = field.label


class SignUpView(generic.CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'auth/signup.html'

def profile(request):
    return render(request, 'profile.html')