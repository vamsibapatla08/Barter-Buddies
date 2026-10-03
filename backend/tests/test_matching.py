from app.matching import score_match


def test_two_way_beats_one_way():
    two_way = score_match(
        my_wants={"GEL_MANICURE"}, my_offers={"CALCULUS_TUTORING"},
        their_wants={"CALCULUS_TUTORING"}, their_offers={"GEL_MANICURE"},
    )
    one_way = score_match(
        my_wants={"GEL_MANICURE"}, my_offers={"CALCULUS_TUTORING"},
        their_wants={"AIRPORT_RIDE"}, their_offers={"GEL_MANICURE"},
    )
    assert two_way > one_way


def test_no_overlap_scores_zero():
    assert score_match(
        my_wants={"HAIRCUT"}, my_offers={"PYTHON_HELP"},
        their_wants={"BAKING"}, their_offers={"GUITAR_LESSON"},
    ) == 0


def test_more_overlap_scores_higher():
    more = score_match(
        my_wants={"GEL_MANICURE", "HAIRCUT"}, my_offers={"CALCULUS_TUTORING"},
        their_wants={"CALCULUS_TUTORING"}, their_offers={"GEL_MANICURE", "HAIRCUT"},
    )
    fewer = score_match(
        my_wants={"GEL_MANICURE"}, my_offers={"CALCULUS_TUTORING"},
        their_wants={"CALCULUS_TUTORING"}, their_offers={"GEL_MANICURE"},
    )
    assert more > fewer