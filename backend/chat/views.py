from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import (
    ChatRequestSerializer,
    ConversationSerializer,
    MessageSerializer,
)
from .services import OpenAIConfigError, chat_completion, chat_completion_stream

SYSTEM_PROMPT = "You are a helpful assistant."


def _history_payload(conversation: Conversation) -> list[dict]:
    """Build the message list (with a system prompt) for the OpenAI API."""
    payload = [{"role": "system", "content": SYSTEM_PROMPT}]
    payload += [
        {"role": m.role, "content": m.content}
        for m in conversation.messages.all()
    ]
    return payload


@api_view(["POST"])
def chat(request):
    """Send a message and get the assistant's reply.

    Body: {"message": "...", "conversation_id": 1 (optional), "stream": false}
    """
    serializer = ChatRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    # Resume an existing conversation or start a new one.
    conversation_id = data.get("conversation_id")
    if conversation_id:
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist:
            return Response(
                {"detail": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        conversation = Conversation.objects.create(
            title=data["message"][:50],
        )

    # Persist the user's message.
    Message.objects.create(
        conversation=conversation,
        role=Message.Role.USER,
        content=data["message"],
    )

    history = _history_payload(conversation)

    # Streaming response (Server-Sent-Events style plain text chunks).
    if data.get("stream"):
        def event_stream():
            collected = []
            try:
                for chunk in chat_completion_stream(history):
                    collected.append(chunk)
                    yield chunk
            finally:
                Message.objects.create(
                    conversation=conversation,
                    role=Message.Role.ASSISTANT,
                    content="".join(collected),
                )

        response = StreamingHttpResponse(
            event_stream(), content_type="text/plain; charset=utf-8"
        )
        response["X-Conversation-Id"] = str(conversation.pk)
        return response

    # Standard JSON response.
    try:
        reply = chat_completion(history)
    except OpenAIConfigError as exc:
        return Response(
            {"detail": str(exc)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    assistant_message = Message.objects.create(
        conversation=conversation,
        role=Message.Role.ASSISTANT,
        content=reply,
    )

    return Response(
        {
            "conversation_id": conversation.pk,
            "reply": MessageSerializer(assistant_message).data,
        },
        status=status.HTTP_200_OK,
    )


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve conversations (with their messages)."""

    queryset = Conversation.objects.prefetch_related("messages").all()
    serializer_class = ConversationSerializer
