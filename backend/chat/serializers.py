from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = ["id", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "title", "created_at", "updated_at", "messages"]
        read_only_fields = ["id", "created_at", "updated_at", "messages"]


class ChatRequestSerializer(serializers.Serializer):
    """Validates the payload sent to the chat endpoint."""

    message = serializers.CharField(
        help_text="The user's message to send to the assistant.",
    )
    conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Existing conversation to continue. Omit to start a new one.",
    )
    stream = serializers.BooleanField(
        required=False,
        default=False,
        help_text="If true, stream the response token-by-token.",
    )
