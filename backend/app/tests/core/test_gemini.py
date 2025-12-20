import pytest
from unittest.mock import MagicMock, patch
from app.services.llm_service import GeminiService
from app.schemas.common import ChatMode

@pytest.mark.asyncio
async def test_chat_stream_standard():
    # 1. ---  Mock the Client --- 
    with patch("app.services.llm_service.genai.Client") as MockClient:
        # ---  Setup the mock stream ---
        mock_stream_chunk = MagicMock()
        mock_stream_chunk.text = "Hello World"
        mock_stream_chunk.candidates = []
        
        # --- Configure the mock client to return an iterator ---
        instance = MockClient.return_value
        instance.models.generate_content_stream.return_value = [mock_stream_chunk]

        service = GeminiService()
        
        # 2. ---  Run the Service ---
        responses = []
        async for chunk in service.chat_stream("Hi", mode=ChatMode.STANDARD):
            responses.append(chunk)

        # 3. ---  Assertions --- 
        assert len(responses) >= 2 # Token + Done
        assert responses[0].type == "token"
        assert responses[0].content == "Hello World"
        assert responses[-1].type == "done"