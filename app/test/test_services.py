from .utils import client, test_service
from fastapi import status

def test_read_service(test_service):
    response = client.get('/services')

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{
        'description': 'Covering your nails',
        'name': 'Coating',
        'id': 1,
        'duration_minutes': 60,
        'price': 400
    }]


def test_read_single_service(test_service):
    response = client.get(f'/services/{test_service.id}')
    assert response.status_code == status.HTTP_200_OK


def test_read_single_service_not_found(test_service):
    response = client.get(f'/services/{test_service.id + 1000}')
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_service(test_service):
    request_data = {
      "name": "Testmanicure",
      "description": "Testmanicure description",
      "price": 998,
      "duration_minutes": 999
    }

    response = client.post("/services", json=request_data)
    data = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert data['name'] == 'Testmanicure'
    assert data['description'] == 'Testmanicure description'
    assert data['price'] == 998
    assert data['duration_minutes'] == 999


def test_create_service_unprocessable_entity(test_service):
    request_data = {
      "name": "Testmanicure",
      "description": "Testmanicure description",
      "price": -100,
      "duration_minutes": 60
    }
    response = client.post('/services', json=request_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_delete_service(test_service):
    response = client.delete(f'/services/{test_service.id}')
    assert response.status_code == status.HTTP_204_NO_CONTENT

    check_response = client.delete(f'/services/{test_service.id}')
    assert check_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_service_not_found(test_service):
    response = client.delete(f'/services/{test_service.id + 1000}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Service not found"}