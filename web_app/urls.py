from django.urls import path, include
from . import views
from .views import SignUpView, ResetPasswordView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/search/', views.search_restaurants, name='search_restaurants'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('home/', views.back_home, name='home'),
    path('create-account/', views.create_account, name='create'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('account/', views.ask_account, name='account'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('api/place-details/', views.get_place_details, name='place_details'),
    path('api/proxy-photo/', views.proxy_place_photo, name='proxy_place_photo'),
    path('api/get_profile', views.get_profile, name='get_profile'),
    path('map/', views.map_view, name='map'),
    path('profile/', views.profile, name='profile'),
    path('password-reset/', ResetPasswordView.as_view(), name='password_reset'),
]