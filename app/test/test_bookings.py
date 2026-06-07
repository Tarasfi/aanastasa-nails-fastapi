from fastapi import status

#------------------------- TEST READ -------------------------
def test_get_all_bookings(client, test_booking):
    response = client.get('/bookings')
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) > 0

#------------------------- TEST CREATE -------------------------

def test_create_booking_success(client, test_service):
    request_data = {
        "client_name": "TestName",
        "client_phone": "+380967676767",
        "booking_date": "2100-06-02",
        "booking_time": "14:30:00",
        "status": "pending",
        "service_id": test_service.id,

    }

    response = client.post("/bookings", json=request_data)
    data = response.json()
    assert response.status_code == status.HTTP_201_CREATED
    assert data['client_name'] == "TestName"
    assert data['client_phone'] == "+380967676767"
    assert data['booking_date'] == "2100-06-02"
    assert data['booking_time'] == "14:30:00"
    assert data['status'] == "pending"
    assert data['service_id'] == test_service.id

def test_create_booking_conflict(client, test_service):
    #First client creates the booking for 14:30
    first_request_data = {
        "client_name": "First",
        "client_phone": "+380967676767",
        "booking_date": "2100-08-02",
        "booking_time": "14:30:00",
        "status": "pending",
        "service_id": test_service.id,

    }
    first_response = client.post("/bookings", json=first_request_data)
    assert first_response.status_code == status.HTTP_201_CREATED

    #Second client creates booking for 14:30
    conflict_data = {
        "client_name": "Second",
        "client_phone": "+380967676767",
        "booking_date": "2100-08-02",
        "booking_time": "14:30:00",
        "status": "pending",
        "service_id": test_service.id,

    }

    response = client.post("/bookings", json=conflict_data)
    data = response.json()

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert data == {'detail': 'Time is occupied.'}


def test_create_booking_past(client, test_service):
    request_data = {
        "client_name": "TestName",
        "client_phone": "+380967676767",
        "booking_date": "2006-06-02",
        "booking_time": "14:30:00",
        "status": "pending",
        "service_id": test_service.id,

    }

    response = client.post('/bookings', json=request_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json() == {'detail': 'Booking time cannot be in the past'}


def test_create_booking_service_not_found(client):
    request_data = {
        "client_name": "TestName",
        "client_phone": "+380967676767",
        "booking_date": "2100-06-02",
        "booking_time": "14:30:00",
        "status": "pending",
        "service_id": 99999,

    }

    response = client.post('/bookings', json=request_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {'detail': 'Service not found'}


#------------------------- TEST PATCH -------------------------

def test_patch_booking_status(client, test_booking):
    request_data = {
          "status": "confirmed"
        }
    response = client.patch(f'/bookings/{test_booking.id}/status', json=request_data)
    data = response.json()
    assert response.status_code == status.HTTP_200_OK
    assert data['status'] == "confirmed"

def test_patch_booking_invalid_status(client, test_booking):
    request_data = {
        "status": "taras67"
    }
    response = client.patch(f'/bookings/{test_booking.id}/status', json=request_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


def test_patch_booking_not_found(client):
    request_data = {
        "status": "confirmed"
    }
    response = client.patch('/bookings/99999/status', json=request_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Booking not found"}



#------------------------- TEST DELETE -------------------------

def test_cancel_booking(client, test_booking):
    response = client.delete(f'/bookings/{test_booking.id}')
    assert response.status_code == status.HTTP_204_NO_CONTENT



def test_delete_booking_not_found(client, test_booking):
    response = client.delete(f'/bookings/{test_booking.id + 100}')
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Booking not found"}
