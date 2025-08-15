import pytest
from dojopool.app import create_app

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_list_user_nfts_success(client):
    response = client.get('/api/v1/nft/list?user_id=1')
    assert response.status_code == 200
    data = response.get_json()
    assert 'nfts' in data
    assert isinstance(data['nfts'], list)

def test_list_user_nfts_missing_user_id(client):
    response = client.get('/api/v1/nft/list')
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data

def test_transfer_nft_success(client):
    payload = {
        'sender_user_id': 1,
        'recipient_user_id': 2,
        'nft_id': 'nft123'
    }
    response = client.post('/api/v1/nft/transfer', json=payload)
    assert response.status_code == 200
    data = response.get_json()
    assert 'success' in data
    assert data['success'] is True

def test_transfer_nft_missing_fields(client):
    response = client.post('/api/v1/nft/transfer', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data 