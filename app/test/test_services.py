from fastapi import status

#------------------------- TEST READ -------------------------

def test_read_services(client, test_service):
    response = client.get('/services')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) > 0


def test_read_single_service(client, test_service):
    response = client.get(f'/services/{test_service.id}')
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data['name'] == 'Coating'
    assert data['description'] == 'Covering your nails'
    assert data['price'] == 400
    assert data['duration_minutes'] == 60


def test_read_single_service_not_found(client, test_service):
    response = client.get(f'/services/{test_service.id + 1000}')
    assert response.status_code == status.HTTP_404_NOT_FOUND

#------------------------- TEST CREATE -------------------------

def test_create_service(client):
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


def test_create_service_unprocessable_content(client):
    request_data = {
      "name": "Testmanicure negative price",
      "description": "Testmanicure negative price description",
      "price": -100,
      "duration_minutes": 60
    }
    response = client.post('/services', json=request_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert 'detail' in response.json()

#------------------------- TEST DELETE -------------------------

def test_delete_service(client, test_service):
    response = client.delete(f'/services/{test_service.id}')
    assert response.status_code == status.HTTP_204_NO_CONTENT

    check_response = client.get(f'/services/{test_service.id}')
    assert check_response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_service_not_found(client, test_service):
    response = client.delete(f'/services/{test_service.id + 1000}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Service not found"}
