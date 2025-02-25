import pytest
from backend.ai_narrative import NarrativeEngine, NarrativeGenerationError

def test_generate_narrative_success():
    venue = "Test Venue"
    data = {"score": 100}
    engine = NarrativeEngine(venue, data)
    narrative = engine.generate_narrative()
    expected = f"In {venue}, an epic battle unfolds with these stats: {data}."
    assert narrative == expected

def test_generate_narrative_failure_empty_venue():
    # An empty venue should cause _prepare_context to fail,
    # resulting in NarrativeGenerationError raised by generate_narrative.
    venue = ""
    data = {"score": 200}
    engine = NarrativeEngine(venue, data)
    with pytest.raises(NarrativeGenerationError):
        engine.generate_narrative()

class FaultyNarrativeEngine(NarrativeEngine):
    """
    A subclass used to simulate a failure in _build_narrative.
    """
    def _build_narrative(self, context):
        raise RuntimeError("Simulated failure in _build_narrative.")

def test_generate_narrative_failure_build_error():
    venue = "Some Venue"
    data = {"score": 50}
    engine = FaultyNarrativeEngine(venue, data)
    with pytest.raises(NarrativeGenerationError):
        engine.generate_narrative() 