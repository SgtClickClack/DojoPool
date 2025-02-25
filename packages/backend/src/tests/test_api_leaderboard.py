import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    return APIClient()

def test_leaderboard_endpoint_success(api_client):
    url = reverse("leaderboard")
    response = api_client.get(url, format="json")
    assert response.status_code == status.HTTP_200_OK
    data = response.data
    assert "players" in data
    # Verify that each player has id, name, and score keys.
    for player in data["players"]:
        assert "id" in player
        assert "name" in player
        assert "score" in player 