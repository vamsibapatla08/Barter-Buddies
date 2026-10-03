def test_recipient_can_accept(client, proposed_exchange, recipient_headers):
    exchange_id = proposed_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/respond",
        headers=recipient_headers,
        json={
            "action": "accept"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "accepted"


def test_recipient_can_decline(client, proposed_exchange, recipient_headers):
    exchange_id = proposed_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/respond",
        headers=recipient_headers,
        json={
            "action": "decline"
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "declined"


def test_requester_cannot_respond(client, proposed_exchange, requester_headers):
    exchange_id = proposed_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/respond",
        headers=requester_headers,
        json={
            "action": "accept"
        },
    )

    assert response.status_code == 403


# ============================================================
# LOCK
# ============================================================

def test_accepted_exchange_can_be_locked(
    client,
    accepted_exchange,
    requester_headers,
):
    exchange_id = accepted_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/lock",
        headers=requester_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "locked"
    assert data["locked_at"] is not None


def test_proposed_exchange_cannot_be_locked(
    client,
    proposed_exchange,
    requester_headers,
):
    exchange_id = proposed_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/lock",
        headers=requester_headers,
    )

    assert response.status_code == 409


def test_unrelated_user_cannot_lock(
    client,
    accepted_exchange,
    unrelated_headers,
):
    exchange_id = accepted_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/lock",
        headers=unrelated_headers,
    )

    assert response.status_code == 403


# ============================================================
# COMPLETE
# ============================================================

def test_requester_completes_first(
    client,
    locked_exchange,
    requester_headers,
):
    exchange_id = locked_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=requester_headers,
    )

    assert response.status_code == 200

    data = response.json()

    # Only ONE person has confirmed so far.
    # Think carefully about what these three values should be.

    assert data["status"] == "locked"
    assert data["requester_completed"] is True
    assert data["recipient_completed"] is False


def test_both_users_complete_exchange(
    client,
    locked_exchange,
    requester_headers,
    recipient_headers,
):
    exchange_id = locked_exchange["id"]

    # Requester confirms first
    first_response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=requester_headers,
    )

    assert first_response.status_code == 200

    first_data = first_response.json()

    assert first_data["status"] == "locked"
    assert first_data["requester_completed"] is True
    assert first_data["recipient_completed"] is False

    # Recipient confirms second
    second_response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=recipient_headers,
    )

    assert second_response.status_code == 200

    second_data = second_response.json()

    # NOW both people have confirmed.
    assert second_data["status"] == "completed"
    assert second_data["requester_completed"] is True
    assert second_data["recipient_completed"] is True


def test_recipient_can_complete_first(
    client,
    locked_exchange,
    recipient_headers,
):
    exchange_id = locked_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=recipient_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "locked"
    assert data["requester_completed"] is False
    assert data["recipient_completed"] is True


def test_accepted_exchange_cannot_be_completed(
    client,
    accepted_exchange,
    requester_headers,
):
    exchange_id = accepted_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=requester_headers,
    )

    assert response.status_code == 409


def test_unrelated_user_cannot_complete(
    client,
    locked_exchange,
    unrelated_headers,
):
    exchange_id = locked_exchange["id"]

    response = client.post(
        f"/exchanges/{exchange_id}/complete",
        headers=unrelated_headers,
    )

    assert response.status_code == 403


# ============================================================
# GET EXCHANGE
# ============================================================

def test_participant_can_get_exchange(
    client,
    proposed_exchange,
    requester_headers,
):
    exchange_id = proposed_exchange["id"]

    response = client.get(
        f"/exchanges/{exchange_id}",
        headers=requester_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == exchange_id
    assert data["status"] == "proposed"


def test_unrelated_user_cannot_get_exchange(
    client,
    proposed_exchange,
    unrelated_headers,
):
    exchange_id = proposed_exchange["id"]

    response = client.get(
        f"/exchanges/{exchange_id}",
        headers=unrelated_headers,
    )

    assert response.status_code == 403