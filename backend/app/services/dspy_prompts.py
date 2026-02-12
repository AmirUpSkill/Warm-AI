import dspy 
from typing import List


class AgentSystemPrompt(dspy.Signature):
    """
        Compose agent system prompt from components.
    """
    base_instructions: str = dspy.InputField(desc="Core Agent Instructions")
    guardrails: List[str] = dspy.InputField(desc="List of behavior guardrails")
    tone: str = dspy.InputField(desc="Tone preset or custom description")
    system_prompt: str = dspy.OutputField(desc="Final Composed System prompt")


class GuardrailCheck(dspy.Signature):
    """
        Check if response violates guardrails.
    """
    response: str = dspy.InputField()
    guardrails: List[str] = dspy.InputField()
    is_safe: bool = dspy.OutputField()
    violation_reason: str = dspy.OutputField()