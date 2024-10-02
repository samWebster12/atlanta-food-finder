from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class UserPlaces(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Each user has one set of places
    place_ids = models.JSONField(default=list)  # Stores a list of place IDs

    def __str__(self):
        return f"{self.user.username}'s places"
