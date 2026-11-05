"""
Ollama Local AI Model Service for LegalSaathi AI.
Communicates with local Ollama instance (default: http://localhost:11434, model: llama3.1:latest).
"""

import os
import requests
from typing import Dict, Any, List, Optional
from app.utils.logger import logger

class OllamaService:
    def __init__(
        self,
        base_url: str = None,
        model: str = None,
        timeout: int = 60
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.1:latest")
        self.timeout = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", timeout))
        self.cpu_timeout = int(os.getenv("OLLAMA_CPU_TIMEOUT_SECONDS", max(self.timeout, 60)))
        self.cpu_max_tokens = int(os.getenv("OLLAMA_CPU_NUM_PREDICT", 192))
        force_cpu = os.getenv("OLLAMA_CPU_FALLBACK", "false").strip().lower()
        self._cpu_fallback = force_cpu in {"1", "true", "yes", "on"}

    def check_health(self) -> Dict[str, Any]:
        """
        Checks whether Ollama is running and whether the target model is installed.
        """
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name") for m in data.get("models", [])]
                # Check exact or prefix match (e.g., 'llama3.1:latest' or 'llama3.1')
                has_target = any(
                    self.model == m or self.model.split(":")[0] == m.split(":")[0]
                    for m in models
                )
                return {
                    "reachable": True,
                    "models": models,
                    "target_model_installed": has_target,
                    "active_model": self.model,
                    "error": None
                }
            return {
                "reachable": False,
                "models": [],
                "target_model_installed": False,
                "active_model": self.model,
                "error": f"Ollama returned HTTP status {resp.status_code}"
            }
        except requests.exceptions.RequestException as e:
            return {
                "reachable": False,
                "models": [],
                "target_model_installed": False,
                "active_model": self.model,
                "error": (
                    "Ollama is not running locally. Please start it using 'ollama serve' "
                    f"and ensure '{self.model}' is installed with 'ollama run {self.model}'."
                )
            }

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Calls Ollama generate API.
        """
        health = self.check_health()
        if not health["reachable"]:
            return {
                "success": False,
                "response": None,
                "error": health["error"],
                "suggestion": "Run 'ollama serve' in your terminal."
            }

        payload: Dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if self._cpu_fallback:
            payload["options"] = {"num_gpu": 0, "num_predict": self.cpu_max_tokens}
        if system_prompt:
            payload["system"] = system_prompt

        try:
            request_timeout = self.cpu_timeout if self._cpu_fallback else self.timeout
            try:
                resp = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=request_timeout
                )
            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
                if self._cpu_fallback:
                    raise
                logger.warning("Ollama GPU inference timed out or disconnected; retrying on CPU.")
                self._cpu_fallback = True
                payload["options"] = {"num_gpu": 0, "num_predict": self.cpu_max_tokens}
                request_timeout = self.cpu_timeout
                resp = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=request_timeout
                )

            # If CUDA initialization fails on this machine, retry the same
            # grounded request on CPU and keep using CPU for later requests.
            gpu_error_markers = (
                "cuda error",
                "shared object initialization failed",
                "llama-server process has terminated",
            )
            response_error = resp.text.lower() if resp.status_code >= 500 else ""
            if not self._cpu_fallback and any(marker in response_error for marker in gpu_error_markers):
                logger.warning("Ollama GPU initialization failed; retrying model generation on CPU.")
                self._cpu_fallback = True
                payload["options"] = {"num_gpu": 0, "num_predict": self.cpu_max_tokens}
                request_timeout = self.cpu_timeout
                resp = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=request_timeout
                )

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "success": True,
                    "response": data.get("response", "").strip(),
                    "model": self.model,
                    "error": None
                }
            elif resp.status_code == 404:
                return {
                    "success": False,
                    "response": None,
                    "error": f"Model '{self.model}' not found in Ollama.",
                    "suggestion": f"Install the model by running 'ollama run {self.model}'."
                }
            else:
                return {
                    "success": False,
                    "response": None,
                    "error": f"Ollama error (HTTP {resp.status_code}): {resp.text}",
                    "suggestion": "Check Ollama terminal logs."
                }
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "response": None,
                "error": f"Ollama model inference timed out after {request_timeout} seconds.",
                "suggestion": "Your computer may need more CPU/RAM resources or a smaller model."
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "response": None,
                "error": f"Connection lost while communicating with Ollama: {str(e)}",
                "suggestion": "Ensure Ollama continues to run in the background."
            }

ollama_service = OllamaService()
