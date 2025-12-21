from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas.chat import ChatStreamResponse
from app.schemas.common import ChatMode
from app.services.llm_service import GeminiService


@pytest.fixture
def gemini_service():
    with patch("app.services.llm_service.genai.Client") as mock_client:
        service = GeminiService()
        service.client = mock_client.return_value
        service.client.aio = MagicMock()
        yield service


def test_extract_citations(gemini_service):
    chunk = MagicMock()
    chunk.web.title = "Source title"
    chunk.web.uri = "https://example.com"

    candidate = MagicMock()
    candidate.grounding_metadata.grounding_chunks = [chunk]

    citations = gemini_service._extract_citations(candidate)
    assert len(citations) == 1
    assert citations[0].title == "Source title"
    assert citations[0].url == "https://example.com"


def test_extract_citations_no_metadata(gemini_service):
    candidate = MagicMock()
    candidate.grounding_metadata = None

    assert gemini_service._extract_citations(candidate) == []


@pytest.mark.asyncio
async def test_chat_stream_standard_mode(gemini_service):
    token_chunk = MagicMock()
    token_chunk.text = "Hello"
    token_chunk.candidates = []
    done_chunk = MagicMock()
    done_chunk.text = None
    done_chunk.candidates = []

    async def stream_generator():
        yield token_chunk
        yield done_chunk

    gemini_service.client.aio.models.generate_content_stream = AsyncMock(
        return_value=stream_generator()
    )

    responses = []
    async for event in gemini_service.chat_stream("Hi", mode=ChatMode.STANDARD):
        responses.append(event)

    assert responses[0].type == "token"
    assert responses[0].content == "Hello"
    assert responses[-1].type == "done"


@pytest.mark.asyncio
async def test_chat_stream_web_search_configures_tools(gemini_service):
    async def stream_generator():
        yield MagicMock(text="chunk", candidates=[])

    gemini_service.client.aio.models.generate_content_stream = AsyncMock(
        return_value=stream_generator()
    )

    async for _ in gemini_service.chat_stream("Query", mode=ChatMode.WEB_SEARCH):
        pass

    called_kwargs = gemini_service.client.aio.models.generate_content_stream.call_args.kwargs
    config = called_kwargs["config"]
    assert config.tools, "Expected Google Search tool to be enabled for WEB_SEARCH mode"


@pytest.mark.asyncio
async def test_chat_stream_emits_citations(gemini_service):
    final_chunk = MagicMock()
    final_chunk.text = None
    citation_candidate = MagicMock()
    citation_candidate.grounding_metadata.grounding_chunks = [
        MagicMock(web=MagicMock(title="Doc", uri="https://doc"))
    ]
    final_chunk.candidates = [citation_candidate]

    async def stream_generator():
        yield final_chunk

    gemini_service.client.aio.models.generate_content_stream = AsyncMock(
        return_value=stream_generator()
    )

    events = []
    async for event in gemini_service.chat_stream("Hi"):
        events.append(event)

    assert any(e.type == "citation" for e in events)


@pytest.mark.asyncio
async def test_chat_stream_handles_exception(gemini_service):
    gemini_service.client.aio.models.generate_content_stream.side_effect = RuntimeError(
        "API down"
    )

    events = []
    async for event in gemini_service.chat_stream("Hi"):
        events.append(event)

    assert events[-1].type == "error"
    assert "error" in events[-1].content.lower()
