"""Which exchange state transitions are legal.

Statuses: proposed, accepted, locked, completed, declined
Actions:  accept, decline, lock, complete
"""


def can_transition(current_status: str, action: str, is_requester: bool) -> bool:
    # nothing moves once it's finished
    if current_status in ("completed", "declined"):
        return False

    if action in ("accept", "decline"):
        # only the person who received the offer can answer it
        return current_status == "proposed" and not is_requester

    if action == "lock":
        return current_status == "accepted"

    if action == "complete":
        return current_status == "locked"

    return False