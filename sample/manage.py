import sys
from django.urls import path
from django.core.management import execute_from_command_line
from django.http import HttpResponse

from app.sample_api import MyApi

def index(request):
    return HttpResponse('<h1>A minimal Django response!</h1>')


urlpatterns = [
    path(r'', index),
    path(r'my_view', MyApi.as_view()),
]

if __name__ == '__main__':
    execute_from_command_line(sys.argv)
