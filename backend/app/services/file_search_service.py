import os
import time
import uuid
import json
from typing import AsyncGenerator, List, Tuple, Any, Optional
from pathlib import Path

from google import genai
from google.genai import types
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.core.logging import app_logger
from app.schemas.chat import ChatStreamResponse
from app.schemas.file_search import FileSearchCitation

# --- Let's Get the Service Settings --- 
settings = get_settings()


class FileSearchService:
    """
        Service for managing Gemini File Search (Serverless RAG).
        Handles file upload, indexing, querying, and cleanup.
    """

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = "gemini-2.5-flash"
        self.system_instruction = """
            You are Warm AI, a professional intelligence assistant with access to uploaded documents.
            Answer questions ONLY using the uploaded document context.
            If the document does not contain the answer, say you cannot find it in the file.
            Be concise, professional, and helpful.
        """

    async def create_store_and_upload(
        self, 
        file_path: str, 
        display_name: str
    ) -> Tuple[str, str]:
        """
        Creates a FileSearchStore and uploads file to it.
        
        Args:
            file_path: Path to the file to upload
            display_name: Display name for the file
            
        Returns:
            Tuple of (store_name, file_name)
            
        Raises:
            Exception: If upload or indexing fails
        """
        app_logger.info(f"Creating File Search Store and uploading: {display_name}")
        
        try:
            # --- First We need Create File Search Store ---
            store_display_name = f"warm-ai-{uuid.uuid4().hex[:10]}"
            
            def _create_store():
                return self.client.file_search_stores.create(
                    config={"display_name": store_display_name}
                )
            
            store = await run_in_threadpool(_create_store)
            app_logger.info(f"Created store: {store.name}")
            
            # --- Second We need Upload file to store with chunking config ---
            chunking_config = {
                "white_space_config": {
                    "max_tokens_per_chunk": 300,
                    "max_overlap_tokens": 30
                }
            }
            
            def _upload_file():
                return self.client.file_search_stores.upload_to_file_search_store(
                    file=file_path,
                    file_search_store_name=store.name,
                    config={
                        "display_name": display_name,
                        "chunking_config": chunking_config
                    }
                )
            
            operation = await run_in_threadpool(_upload_file)
            
            # --- Third We need Poll operation until complete ---
            def _poll_operation():
                op = operation
                start_time = time.time()
                timeout = 600  # 10 minutes
                
                while not getattr(op, "done", False):
                    if time.time() - start_time > timeout:
                        raise TimeoutError("File indexing timeout")
                    time.sleep(2)
                    op = self.client.operations.get(op)
                
                return op
            
            final_op = await run_in_threadpool(_poll_operation)
            app_logger.info(f"File indexed successfully: {display_name}")
            
            return store.name, display_name
            
        except Exception as e:
            app_logger.error(f"Error in create_store_and_upload: {str(e)}")
            raise

    async def chat_with_file(
        self, 
        store_name: str, 
        query: str,
        model: str = "gemini-2.5-flash"
    ) -> AsyncGenerator[ChatStreamResponse, None]:
        """
        Streams RAG response with citations from the file.
        
        Args:
            store_name: Name of the FileSearchStore
            query: User's question
            model: Gemini model to use
            
        Yields:
            ChatStreamResponse chunks (tokens, citations, done, error)
        """
        app_logger.info(f"File Search Query | Store: {store_name}")
        
        try:
            # --- Configure File Search tool ---
            config = types.GenerateContentConfig(
                system_instruction=self.system_instruction,
                temperature=0.2,
                tools=[
                    types.Tool(
                        file_search=types.FileSearch(
                            file_search_store_names=[store_name]
                        )
                    )
                ]
            )
            
            # --- Stream response ---
            response_stream = await self.client.aio.models.generate_content_stream(
                model=model,
                contents=query,
                config=config
            )
            
            # --- Stream tokens ---
            last_chunk = None
            async for chunk in response_stream:
                last_chunk = chunk
                if chunk.text:
                    yield ChatStreamResponse(
                        type="token",
                        content=chunk.text
                    )
            
            # --- Extract and yield citations ---
            if last_chunk is not None and last_chunk.candidates:
                citations = self._extract_file_citations(last_chunk.candidates[0])
                if citations:
                    # Convert FileSearchCitation to dict for JSON serialization
                    citations_dict = [
                        {
                            "source_title": c.source_title,
                            "text_segment": c.text_segment,
                            "start_index": c.start_index,
                            "end_index": c.end_index
                        }
                        for c in citations
                    ]
                    yield ChatStreamResponse(
                        type="file_citation",
                        content=json.dumps(citations_dict) 
                    )
            
            # Signal completion
            yield ChatStreamResponse(type="done")
            
        except Exception as e:
            app_logger.error(f"File Search Error: {str(e)}")
            yield ChatStreamResponse(
                type="error",
                content="I encountered an error searching the document."
            )

    def _extract_file_citations(self, candidate: Any) -> List[FileSearchCitation]:
        """
        Parses grounding_metadata for file search citations.
        
        Args:
            candidate: Response candidate from Gemini
            
        Returns:
            List of FileSearchCitation objects
        """
        citations = []
        
        try:
            if not hasattr(candidate, 'grounding_metadata'):
                return citations
            
            gm = candidate.grounding_metadata
            if not gm:
                return citations
            
            # --- Extract grounding chunks (source documents) ---
            chunks = getattr(gm, 'grounding_chunks', [])
            
            # --- Extract grounding supports (which parts of response are grounded) ---
            supports = getattr(gm, 'grounding_supports', [])
            
            for support in supports:
                segment = getattr(support, 'segment', None)
                if not segment:
                    continue
                
                segment_text = getattr(segment, 'text', '').strip()
                start_idx = getattr(segment, 'start_index', None)
                end_idx = getattr(segment, 'end_index', None)
                
                # --- Get source title from chunks ---
                indices = getattr(support, 'grounding_chunk_indices', [])
                source_title = "Document"
                
                for idx in indices:
                    if idx < len(chunks):
                        chunk = chunks[idx]
                        ctx = getattr(chunk, 'retrieved_context', None)
                        if ctx:
                            source_title = getattr(ctx, 'title', 'Document')
                            break
                
                citations.append(FileSearchCitation(
                    source_title=source_title,
                    text_segment=segment_text,
                    start_index=start_idx,
                    end_index=end_idx
                ))
            
        except Exception as e:
            app_logger.error(f"Error extracting citations: {str(e)}")
        
        return citations

    async def delete_store(self, store_name: str) -> None:
        """
        Delete a FileSearchStore to cleanup resources.
        
        Args:
            store_name: Name of the store to delete
        """
        try:
            app_logger.info(f"Deleting File Search Store: {store_name}")
            
            def _delete():
                self.client.file_search_stores.delete(
                    name=store_name,
                    config={"force": True}
                )
            
            await run_in_threadpool(_delete)
            app_logger.info(f"Store deleted: {store_name}")
            
        except Exception as e:
            app_logger.error(f"Error deleting store: {str(e)}")
    