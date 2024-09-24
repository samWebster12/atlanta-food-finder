from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search/', views.search_restaurants, name='search_restaurants'),
    path('login/', views.login_view, name='login'),
    path('account/', views.ask_account, name='account'),
    path('create-account/', views.create_account, name='create'),
    path('home/', views.back_home, name='home')
]