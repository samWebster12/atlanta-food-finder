from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User

class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        max_length=254,
        widget=forms.TextInput(attrs={
            'class': 'login-input',
            'placeholder': 'Username'
        })
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={
            'class': 'login-input',
            'placeholder': 'Password'
        })
    )

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label='Email')
    
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")
    
    def __init__(self, *args, **kwargs):
        super(CustomUserCreationForm, self).__init__(*args, **kwargs)
        
        # Add custom classes and placeholders to form fields
        self.fields['username'].widget.attrs.update({
            'class': 'login-input',
            'placeholder': 'Username'
        })
        self.fields['email'].widget.attrs.update({
            'class': 'login-input',
            'placeholder': 'Email'
        })
        self.fields['password1'].widget.attrs.update({
            'class': 'login-input',
            'placeholder': 'Password'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'login-input',
            'placeholder': 'Confirm Password'
        })