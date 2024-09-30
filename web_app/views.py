from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.conf import settings
from django.urls import reverse_lazy
from django.views import generic
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET
from django.contrib.auth import authenticate, login, logout, forms
from django.contrib.auth.models import User
from django import forms
import json
import requests
USE_DUMMY_DATA = True


def index(request):
    return render(request, 'index.html')

def map(request):
    return render(request, 'map.html')
@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
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
        form = AuthenticationForm()
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