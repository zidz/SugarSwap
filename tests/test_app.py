import json
import pytest
from unittest.mock import patch, MagicMock
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_index(client):
    """Test the index route."""
    response = client.get('/')
    assert response.status_code == 200
    assert b"SugarSwap" in response.data

def test_serve_manifest(client):
    """Test the manifest route."""
    response = client.get('/manifest.json')
    assert response.status_code == 200
    assert response.content_type == 'application/json'

@patch('app.requests.get')
def test_product_proxy_success(mock_get, client):
    """Test the product proxy on a successful API call."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_product_data = {
        "status": 1,
        "product": {
            "product_name": "Coca-Cola Zero",
            "nutriments": {"sugars_100g": 0}
        }
    }
    mock_response.json.return_value = mock_product_data
    mock_response.raise_for_status.return_value = None
    mock_get.return_value = mock_response

    response = client.get('/api/proxy/product/123456789')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['product']['product_name'] == "Coca-Cola Zero"
    mock_get.assert_called_once_with('https://world.openfoodfacts.org/api/v2/product/123456789.json')

@patch('app.requests.get')
def test_product_proxy_not_found(mock_get, client):
    """Test the product proxy when a product is not found."""
    mock_response = MagicMock()
    mock_response.status_code = 200 # The API itself returns 200 but with a status 0 for not found
    mock_response.json.return_value = {"status": 0, "status_verbose": "product not found"}
    mock_response.raise_for_status.return_value = None
    mock_get.return_value = mock_response

    response = client.get('/api/proxy/product/000000000')
    assert response.status_code == 404
    data = json.loads(response.data)
    assert data['message'] == "Product not found"

@patch('app.requests.get')
def test_product_proxy_api_error(mock_get, client):
    """Test the product proxy when the external API returns an error."""
    mock_get.side_effect = requests.exceptions.RequestException("API is down")

    response = client.get('/api/proxy/product/123456789')
    assert response.status_code == 500
    data = json.loads(response.data)
    assert "API is down" in data['message']

