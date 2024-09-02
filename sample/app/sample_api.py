from rest_framework.views import APIView
from rest_framework.response import Response

class MyApi(APIView):
    def get(self, request):
        return Response({ 'response': 'Hello' })
