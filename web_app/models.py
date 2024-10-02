from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class UserPlaces(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Each user has one set of places
    place_ids = models.JSONField(default=list)  # Stores a list of place IDs

    def __str__(self):
        return f"{self.user.username}'s places"

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    place_id = models.CharField(max_length=255)
    rating = models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user.username} for {self.place_id}"