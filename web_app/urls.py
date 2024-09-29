from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search/', views.search_restaurants, name='search_restaurants'),
    path('map/', views.map_view, name='map'),
    path('login/', views.login_view, name='login'),
    path('account/', views.ask_account, name='account'),
    path('create-account/', views.create_account, name=',create'),
    path('home/', views.back_home, name='home'),
    path('place-details/', views.get_place_details, name='place_details'),
    path('proxy_photo/', views.proxy_place_photo, name='proxy_place_photo'),
]