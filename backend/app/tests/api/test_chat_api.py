from typing import AsyncGenerator

import pytest
from fastapi.testclient import TestClient

from app.schemas.chat import ChatStreamResponse
from app.schemas.common import ChatMode


@pytest.mark.asyncio
async def test_chat_stream_success(client: TestClient, mock_services):
    async def fake_stream(*_args, **_kwargs) -> AsyncGenerator[ChatStreamResponse, None]:
        yield ChatStreamResponse(type="token", content="Hello")
        yield ChatStreamResponse(type="citation", sources=[])
        yield ChatStreamResponse(type="done")

    mock_services["gemini"].chat_stream = fake_stream

    with client.stream(
        "POST",
        "/api/v1/chat/message",
        json={"message": "Hi", "mode": ChatMode.STANDARD.value},
    ) as response:
        chunks = "".join(response.iter_text())

    assert response.status_code == 200
    assert "\"type\":\"token\"" in chunks
    assert "\"type\":\"citation\"" in chunks
    assert "\"type\":\"done\"" in chunks


def test_chat_stream_handles_error(client: TestClient, mock_services):
    async def failing_stream(*_args, **_kwargs):
        raise RuntimeError("boom")

    mock_services["gemini"].chat_stream = failing_stream

    with client.stream(
        "POST",
        "/api/v1/chat/message",
        json={"message": "Hi", "mode": ChatMode.STANDARD.value},
    ) as response:
        chunks = "".join(response.iter_text())

    assert response.status_code == 200
    assert "\"type\":\"error\"" in chunks
    assert "Please try again" in chunks
