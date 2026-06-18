from fastapi.testclient import TestClient

from app.main import app


def test_login_returns_access_token():
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_rejects_wrong_password():
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong-password"},
    )

    assert response.status_code == 401
