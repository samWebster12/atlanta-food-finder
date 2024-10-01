from django.db import models

# Create your models here.
class User(models.Model):
    username = models.CharField(max_length=50)
    email = models.EmailField()
    password = models.CharField(max_length=50)

    def __str__(self):
        return self.username
    
class FavoriteRestaurant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    restaurant_id = models.CharField(max_length=255)
    restaurant_name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('user', 'restaurant_id')

    def __str__(self):
        return f"{self.user.username} - {self.restaurant_name}"