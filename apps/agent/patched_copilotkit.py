"""Patches CopilotKit middleware for DeepAgent state compatibility."""
from copilotkit import CopilotKitMiddleware


class StatefulCopilotKitMiddleware(CopilotKitMiddleware):
    """Fixes two issues with CopilotKit + create_deep_agent:
    1. Pydantic context objects need .model_dump() for JSON serialization
    2. Intercepted HITL tool calls get dropped on LangGraph checkpoint
    """

    _HITL_KEY = "__copilotkit_intercepted_tool_calls__"

    async def aafter_model(self, state, runtime):
        result = await super().aafter_model(state, runtime)
        # Store intercepted HITL calls in AIMessage.additional_kwargs
        intercepted = state.get("copilotkit", {}).get("intercepted_tool_calls", [])
        if intercepted and result and "messages" in result:
            for msg in result["messages"]:
                if hasattr(msg, "additional_kwargs"):
                    msg.additional_kwargs[self._HITL_KEY] = intercepted
        return result

    async def aafter_agent(self, state, runtime):
        # Restore intercepted calls from additional_kwargs before returning
        messages = state.get("messages", [])
        for msg in reversed(messages):
            stored = getattr(msg, "additional_kwargs", {}).get(self._HITL_KEY)
            if stored:
                state.setdefault("copilotkit", {})["intercepted_tool_calls"] = stored
                break
        return await super().aafter_agent(state, runtime)
