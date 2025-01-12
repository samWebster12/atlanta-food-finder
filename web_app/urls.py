from django.urls import path, include
from . import views
from .views import SignUpView, ResetPasswordView
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.map_view, name='index'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('home/', views.back_home, name='home'),
    path('create-account/', views.create_account, name='create'),
    path('map/', views.map_view, name='map'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('account/', views.ask_account, name='account'),
    path('signup/', SignUpView.as_view(), name='signup'),
    path('profile/', views.profile, name='profile'),
    path('api/place-details/', views.get_place_details, name='place_details'),
    path('api/proxy-photo/', views.proxy_place_photo, name='proxy_place_photo'),
    path('api/add_favorite', views.add_place_to_favorites, name=''),
    path('api/remove_favorite', views.remove_place_from_favorites, name=''),
    path('api/check_favorite', views.check_favorite, name='check_favourite'),
    path('api/get_profile', views.get_profile, name='get_profile'),
    path('api/search/', views.search_restaurants, name='search_restaurants'),
    path('api/create_review/', views.create_review, name='create_review'),
    path('api/get_reviews/', views.get_reviews, name='get_reviews'),
    path('password-reset/', ResetPasswordView.as_view(), name='password_reset'),
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(template_name='users/password_reset_done.html'), name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(template_name='users/password_reset_confirm.html'), name='password_reset_confirm'),
    path('password-reset-complete/', auth_views.PasswordResetCompleteView.as_view(template_name='users/password_reset_complete.html'), name='password_reset_complete'),
]