from fastapi.testclient import TestClient


def test_scalar_docs_page_loads(client: TestClient) -> None:
    response = client.get("/scalar")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


# makes sure the router actually got mounted
def test_openapi_schema_lists_health_route(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert "/api/health" in response.json()["paths"]
