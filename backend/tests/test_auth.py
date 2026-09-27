def test_register_login_me(client):
    res = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Ali Valiyev", "email": "Ali@Test.uz", "password": "secret123"},
    )
    assert res.status_code == 201
    assert res.json()["user"]["email"] == "ali@test.uz"
    assert res.json()["user"]["role"] == "student"

    dup = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Ali", "email": "ali@test.uz", "password": "secret123"},
    )
    assert dup.status_code == 409

    bad = client.post("/api/v1/auth/login", json={"email": "ali@test.uz", "password": "wrong-pass"})
    assert bad.status_code == 401

    token = client.post("/api/v1/auth/login", json={"email": "ALI@test.uz", "password": "secret123"}).json()
    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token['access_token']}"})
    assert me.status_code == 200
    assert me.json()["full_name"] == "Ali Valiyev"


def test_me_requires_token(client):
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_short_password_rejected(client):
    res = client.post("/api/v1/auth/register", json={"full_name": "A B", "email": "a@b.uz", "password": "123"})
    assert res.status_code == 422
