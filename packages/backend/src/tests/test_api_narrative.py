import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

def test_narrative_endpoint_success(api_client):
    url = reverse("narrative")
    payload = {
        "venue_context": "Test Venue",
        "match_data": {"score": 100}
    }
    response = api_client.post(url, data=payload, format="json")
    expected_message = "In Test Venue, an epic battle unfolds with these stats: {'score': 100}."
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get("narrative") == expected_message

def test_narrative_endpoint_failure_empty_venue(api_client):
    url = reverse("narrative")
    payload = {
        "venue_context": "",
        "match_data": {"score": 100}
    }
    response = api_client.post(url, data=payload, format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "error" in response.data 