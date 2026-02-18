import json
import pytest
from app import app, USERS_FILE
import os

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    # Setup a clean users file for each test
    if os.path.exists(USERS_FILE):
        os.remove(USERS_FILE)
    with open(USERS_FILE, 'w') as f:
        json.dump({"users": {}}, f)

    with app.test_client() as client:
        yield client
    
    # Teardown the users file
    if os.path.exists(USERS_FILE):
        os.remove(USERS_FILE)

def test_register_success(client):
    """Test successful user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 201
    assert response.get_json()['status'] == 'success'
    
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)
        assert 'testuser' in users['users']

def test_register_existing_user(client):
    """Test registration with a username that already exists."""
    client.post('/api/auth/register', json={'username': 'testuser', 'password': 'password123'})
    response = client.post('/api/auth/register', json={'username': 'testuser', 'password': 'password123'})
    assert response.status_code == 409
    assert response.get_json()['message'] == 'Username already exists'

def test_login_logout(client):
    """Test successful login and logout."""
    client.post('/api/auth/register', json={'username': 'testuser', 'password': 'password123'})
    
    # Test successful login
    login_response = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password12á3'})
    assert login_response.status_code == 401 # Corrected expectation for failed login
    
    login_response_success = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    assert login_response_success.status_code == 200
    assert login_response_success.get_json()['status'] == 'success'

    # Check session
    with client.session_transaction() as sess:
        assert sess['username'] == 'testuser'
    
    # Test logout
    logout_response = client.post('/api/auth/logout')
    assert logout_response.status_code == 200
    with client.session_transaction() as sess:
        assert 'username' not in sess

def test_login_invalid_credentials(client):
    """Test login with invalid credentials."""
    client.post('/api/auth/register', json={'username': 'testuser', 'password': 'password123'})
    response = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'wrongpassword'})
    assert response.status_code == 401
    assert response.get_json()['message'] == 'Invalid username or password'

def test_data_endpoints_unauthorized(client):
    """Test that data endpoints require login."""
    get_response = client.get('/api/user/data')
    assert get_response.status_code == 401
    
    post_response = client.post('/api/user/data', json={})
    assert post_response.status_code == 401

def test_get_and_save_user_data(client):
    """Test getting and saving data for a logged-in user."""
    client.post('/api/auth/register', json={'username': 'testuser', 'password': 'password123'})
    client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    
    # Test GET
    get_response = client.get('/api/user/data')
    assert get_response.status_code == 200
    data = get_response.get_json()
    assert data['gamification_state']['level'] == 1
    
    # Test POST
    new_gamification_state = data['gamification_state']
    new_gamification_state['level'] = 5
    post_response = client.post('/api/user/data', json={
        'gamification_state': new_gamification_state,
        'product_cache': {}
    })
    assert post_response.status_code == 200
    
    # Verify data was saved
    with open(USERS_FILE, 'r') as f:
        users = json.load(f)
        assert users['users']['testuser']['gamification_state']['level'] == 5
