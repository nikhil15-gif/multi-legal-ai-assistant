"""
OpenAI Service for LegalSaathi AI (Optional Provider).
"""

import os
import requests
from typing import Dict, Any, Optional
from app.utils.logger import logger

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_configured():
            return {
                "success": False,
                "response": None,
                "error": "OpenAI API key is not configured in backend environment (.env).",
                "suggestion": "Set OPENAI_API_KEY in backend/.env to enable OpenAI."
            }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3
        }

        try:
            resp = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return {
                    "success": True,
                    "response": content.strip(),
                    "model": self.model,
                    "error": None
                }
            return {
                "success": False,
                "response": None,
                "error": f"OpenAI API error (HTTP {resp.status_code}): {resp.text}",
                "suggestion": "Check OpenAI API key and usage limits."
            }
        except Exception as e:
            return {
                "success": False,
                "response": None,
                "error": f"Failed to connect to OpenAI API: {str(e)}",
                "suggestion": "Check network connection."
            }

openai_service = OpenAIService()
