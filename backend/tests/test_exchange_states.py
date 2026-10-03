from app.exchange_states import can_transition

STATUSES = ["proposed", "accepted", "locked", "completed", "declined"]
ACTIONS = ["accept", "decline", "lock", "complete"]
PARTIES = [True, False]


# Rule 1: only the recipient can accept or decline a proposed exchange

def test_recipient_can_accept_proposed():
    assert can_transition("proposed", "accept", is_requester=False) is True


def test_recipient_can_decline_proposed():
    assert can_transition("proposed", "decline", is_requester=False) is True


def test_requester_cannot_accept_proposed():
    assert can_transition("proposed", "accept", is_requester=True) is False


def test_requester_cannot_decline_proposed():
    assert can_transition("proposed", "decline", is_requester=True) is False


# Rule 2: you cannot accept something already accepted

def test_cannot_accept_already_accepted():
    for is_requester in PARTIES:
        assert can_transition("accepted", "accept", is_requester) is False


# Rule 3: lock is only valid from accepted

def test_lock_valid_from_accepted():
    for is_requester in PARTIES:
        assert can_transition("accepted", "lock", is_requester) is True


def test_lock_invalid_from_other_statuses():
    for status in STATUSES:
        if status == "accepted":
            continue
        for is_requester in PARTIES:
            assert can_transition(status, "lock", is_requester) is False


# Rule 4: complete is only valid from locked

def test_complete_valid_from_locked():
    for is_requester in PARTIES:
        assert can_transition("locked", "complete", is_requester) is True


def test_complete_invalid_from_other_statuses():
    for status in STATUSES:
        if status == "locked":
            continue
        for is_requester in PARTIES:
            assert can_transition(status, "complete", is_requester) is False


# Rule 5: nothing can transition out of completed or declined

def test_completed_is_terminal():
    for action in ACTIONS:
        for is_requester in PARTIES:
            assert can_transition("completed", action, is_requester) is False


def test_declined_is_terminal():
    for action in ACTIONS:
        for is_requester in PARTIES:
            assert can_transition("declined", action, is_requester) is False
