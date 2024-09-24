from django.urls import path, include
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search/', views.search_restaurants, name='search_restaurants'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('map/', views.map, name='map'),
    path('home/', views.back_home, name='home'),
    path('login/', views.login_view, name='login'),
    path('account/', views.ask_account, name='account'),
    path('create-account/', views.create_account, name='create')
    # path('login/', views.login, name='login'),
    # path('signup/', views.signup, name='signup'),
    # path('logout/', views.logout, name='logout'),
]