import pytest

def test_placeholder():
    """Placeholder test to ensure pytest runs successfully."""
    assert True

def test_basic_math():
    """Basic math test."""
    assert 2 + 2 == 4
    assert 3 * 3 == 9

@pytest.mark.unit
def test_unit_example():
    """Example unit test."""
    result = "hello world".upper()
    assert result == "HELLO WORLD"

@pytest.mark.integration
def test_integration_example():
    """Example integration test."""
    # This would typically test integration with external services
    assert True
