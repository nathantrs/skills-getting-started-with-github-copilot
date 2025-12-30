from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

TEST_EMAIL = "test.user@example.com"
ACTIVITY = "Chess Club"


def test_get_activities_contains_expected_activity():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert ACTIVITY in data
    assert "participants" in data[ACTIVITY]


def test_signup_adds_participant_and_subsequent_get_shows_it():
    # Ensure TEST_EMAIL is not already registered
    resp0 = client.get("/activities")
    participants_before = set(resp0.json()[ACTIVITY]["participants"])
    if TEST_EMAIL in participants_before:
        # If present, remove for a clean test run
        client.delete(f"/activities/{ACTIVITY}/unregister?email={TEST_EMAIL}")

    # Sign up
    resp = client.post(f"/activities/{ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 200
    assert TEST_EMAIL in resp.json()["message"]

    # Verify it's present in a subsequent GET
    resp2 = client.get("/activities")
    assert resp2.status_code == 200
    participants_after = set(resp2.json()[ACTIVITY]["participants"])
    assert TEST_EMAIL in participants_after


def test_unregister_removes_participant():
    # Ensure TEST_EMAIL is registered
    client.post(f"/activities/{ACTIVITY}/signup?email={TEST_EMAIL}")

    # Unregister
    resp = client.delete(f"/activities/{ACTIVITY}/unregister?email={TEST_EMAIL}")
    assert resp.status_code == 200
    assert TEST_EMAIL in resp.json()["message"]

    # Verify removed
    resp2 = client.get("/activities")
    participants = set(resp2.json()[ACTIVITY]["participants"])
    assert TEST_EMAIL not in participants


def test_unregister_nonexistent_returns_400():
    # Try to unregister someone not signed up
    nonexistent = "no.such.user@example.com"
    resp = client.delete(f"/activities/{ACTIVITY}/unregister?email={nonexistent}")
    assert resp.status_code == 400


def test_signup_duplicate_returns_400():
    # Ensure TEST_EMAIL is registered
    client.post(f"/activities/{ACTIVITY}/signup?email={TEST_EMAIL}")

    # Try to sign up again
    resp = client.post(f"/activities/{ACTIVITY}/signup?email={TEST_EMAIL}")
    assert resp.status_code == 400

    # Cleanup
    client.delete(f"/activities/{ACTIVITY}/unregister?email={TEST_EMAIL}")
