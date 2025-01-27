import requests
import json

def test_public_endpoints():
    base_url = 'http://localhost:5000'
    headers = {'Content-Type': 'application/json'}
    
    # Test root endpoint
    print("\nTesting root endpoint:")
    response = requests.get(base_url, headers=headers)
    print(f'Status Code: {response.status_code}')
    print(f'Response: {response.json()}')
    
    # Test achievement leaderboard endpoint
    print("\nTesting leaderboard endpoint:")
    response = requests.get(f'{base_url}/api/achievements/leaderboard', headers=headers)
    print(f'Status Code: {response.status_code}')
    if response.status_code == 200:
        print(f'Response: {response.json()}')
    else:
        print(f'Error: {response.text}')

if __name__ == '__main__':
    test_public_endpoints() 