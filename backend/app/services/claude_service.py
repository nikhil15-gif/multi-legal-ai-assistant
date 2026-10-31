"""
Anthropic Claude AI Service for LegalSaathi AI (Optional Provider).
"""

import os
import requests
from typing import Dict, Any, Optional
from app.utils.logger import logger

class ClaudeService:
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "response": None,
                "error": "Anthropic API key is not configured in backend environment (.env).",
                "suggestion": "Set ANTHROPIC_API_KEY in backend/.env to enable Claude AI."
            }

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "messages": [{"role": "user", "content": prompt}]
        }
        if system_prompt:
            payload["system"] = system_prompt

        try:
            resp = requests.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                text = "".join(block.get("text", "") for block in data.get("content", []))
                return {
                    "success": True,
                    "response": text.strip(),
                    "model": self.model,
                    "error": None
                }
            return {
                "success": False,
                "response": None,
                "error": f"Claude API error (HTTP {resp.status_code}): {resp.text}",
                "suggestion": "Verify your Anthropic API key and account credits."
            }
        except Exception as e:
            return {
                "success": False,
                "response": None,
                "error": f"Failed to connect to Claude API: {str(e)}",
                "suggestion": "Check internet connectivity."
            }

claude_service = ClaudeService()
