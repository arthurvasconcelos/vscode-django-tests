from rest_framework import status
from rest_framework.test import APITestCase


class SampleViewsTest(APITestCase):
    def test_GET_Sample_Return200(self):
        # Arrange / Act
        response = self.client.get('/my_view')

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_GET_Sample_ReturnHello(self):
        # Arrange / Act
        response = self.client.get('/my_view')

        # Assert
        self.assertEqual(response.data['response'], 'Hello')
