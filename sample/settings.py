DEBUG=True
ALLOWED_HOSTS = ('*',)

ROOT_URLCONF = 'manage'
SECRET_KEY = 'my_super_secret'

REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": "./db.sqlite3",
    }
}

INSTALLED_APPS = [
    'app',
    'rest_framework',
    "django.contrib.auth",
    "django.contrib.contenttypes",
]
