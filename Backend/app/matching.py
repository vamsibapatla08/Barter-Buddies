def score_match(my_wants, my_offers, their_wants, their_offers) -> int:
    """Score how good a trade between two people would be.

    All four arguments are sets of skill IDs like {"CALCULUS_TUTORING"}.
    """
    they_cover = len(my_wants & their_offers)
    i_cover = len(their_wants & my_offers)

    if they_cover == 0 and i_cover == 0:
        return 0

    score = (they_cover + i_cover) * 10

    if they_cover > 0 and i_cover > 0:
        score += 50

    return score