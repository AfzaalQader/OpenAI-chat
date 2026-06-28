"""Thin wrapper around the OpenAI client.

Keeping the OpenAI calls here (instead of in the views) makes the code
easier to test and to swap out later.
"""

from __future__ import annotations

from typing import Iterator

from django.conf import settings
from openai import OpenAI


class OpenAIConfigError(RuntimeError):
    """Raised when the OpenAI client is not configured correctly."""


def _get_client() -> OpenAI:
    if not settings.OPENAI_API_KEY:
        raise OpenAIConfigError(
            "OPENAI_API_KEY is not set. Add it to your .env file."
        )
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def chat_completion(messages: list[dict]) -> str:
    """Return a single assistant reply for the given message history."""
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content or ""


def chat_completion_stream(messages: list[dict]) -> Iterator[str]:
    """Yield assistant reply chunks as they arrive from OpenAI."""
    client = _get_client()
    stream = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=messages,
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content
