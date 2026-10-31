"""
Unified AI Orchestration Service for LegalSaathi AI.
Integrates Ollama (local default), Claude, and OpenAI with strict legal grounding.
"""

import os
from typing import Dict, Any, List, Optional
from app.models.schemas import SourceCitation, LegalRecord
from app.services.ollama_service import ollama_service
from app.services.claude_service import claude_service
from app.services.openai_service import openai_service
from app.services.translation_service import translation_service
from app.utils.logger import logger

LEGAL_SYSTEM_PROMPT = """You are LegalSaathi AI, a professional multilingual Indian Legal Rights Awareness AI Assistant.
Your mission is to help Indian citizens understand their basic legal rights in simple, accessible language.

CRITICAL INSTRUCTIONS:
1. Always be helpful, objective, respectful, and clear. Avoid dense legal jargon.
2. Ground your answer strictly in the provided verified Indian legal sources.
3. Distinguish between verified statutory provisions and general explanations.
4. CRITICAL CRIMINAL LAW NOTE: The Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023 came into effect on July 1, 2024. For offences committed BEFORE July 1, 2024, IPC and CrPC apply under Section 531 BNSS / Section 358 BNS. For offences ON or AFTER July 1, 2024, BNS and BNSS apply. Clearly mention this distinction when answering criminal or police procedure questions.
5. If the provided legal sources do not cover the user's specific question, explicitly state: "The verified legal knowledge base does not contain a specific statutory record for this scenario. Here is general awareness information..." Do NOT invent fake act names, fake section numbers, or fictional URLs.
6. Never claim to be a lawyer, never give individual legal advice, and never guarantee legal outcomes.
7. Always advise consulting a qualified lawyer or the National Legal Services Authority (NALSA Toll-Free Helpline: 15100) for formal court representation.
8. Answer in the language specified by the user prompt (English, Hindi, or Kannada).
"""

class AIService:
    def __init__(self):
        self.default_provider = os.getenv("DEFAULT_AI_PROVIDER", "ollama").lower()

    def get_status(self) -> Dict[str, Any]:
        """Returns the status of all AI providers."""
        ollama_health = ollama_service.check_health()
        return {
            "provider": self.default_provider,
            "ollama_reachable": ollama_health["reachable"],
            "ollama_models": ollama_health["models"],
            "active_model": ollama_health["active_model"],
            "is_ready": ollama_health["reachable"],
            "message": "Ollama is ready" if ollama_health["reachable"] else ollama_health["error"],
            "optional_providers": {
                "claude": claude_service.is_configured(),
                "openai": openai_service.is_configured()
            }
        }

    def generate_legal_answer(
        self,
        query: str,
        retrieved_sources: List[LegalRecord],
        target_lang: str = "en",
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a grounded legal answer using the active AI provider or fallback synthesis.
        """
        chosen_provider = (provider or self.default_provider).lower()

        # Build context from retrieved legal records
        if retrieved_sources:
            context_blocks = []
            for idx, rec in enumerate(retrieved_sources, 1):
                explanation = rec.simplified_explanation
                if target_lang == "hi" and rec.simplified_explanation_hi:
                    explanation = rec.simplified_explanation_hi
                elif target_lang == "kn" and rec.simplified_explanation_kn:
                    explanation = rec.simplified_explanation_kn

                context_blocks.append(
                    f"[Source {idx}]\n"
                    f"Document ID: {rec.document_id}\n"
                    f"Act & Section: {rec.act_name} - {rec.section_number}\n"
                    f"Provision Title: {rec.provision_title}\n"
                    f"Official Portal: {rec.official_source_url}\n"
                    f"Summary: {explanation}\n"
                    f"Statutory Text: {rec.source_text}\n"
                )
            context_str = "\n".join(context_blocks)
        else:
            context_str = "No specific statutory source matched in the knowledge base."

        lang_instructions = {
            "en": "Respond in simple, clear English.",
            "hi": "कृपया सरल और स्पष्ट हिंदी (Devanagari script) में उत्तर दें। कानूनी धाराओं और अधिनियमों का नाम स्पष्ट रूप से उल्लेख करें।",
            "kn": "ದಯವಿಟ್ಟು ಸರಳ ಮತ್ತು ಸ್ಪಷ್ಟ ಕನ್ನಡದಲ್ಲಿ (Kannada script) ಉತ್ತರಿಸಿ. ಕಾನೂನಿನ ಕಾಯ್ದೆ ಮತ್ತು ಸೆಕ್ಷನ್ ವಿವರಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಉಲ್ಲೇಖಿಸಿ."
        }.get(target_lang, "Respond in simple English.")

        prompt = f"""User Question:
"{query}"

Target Language Instruction:
{lang_instructions}

Verified Indian Legal Context:
{context_str}

Please provide a helpful, step-by-step citizen rights explanation based on the legal context above.
Include:
1. Direct answer in simple language
2. Applicable legal act and section (if covered in context)
3. Actionable next steps (e.g. where to file, relevant portal or authority)
4. Important cautionary note or limitation period
"""

        # Provider routing
        result = None
        if chosen_provider == "claude" and claude_service.is_configured():
            result = claude_service.generate(prompt, LEGAL_SYSTEM_PROMPT)
        elif chosen_provider == "openai" and openai_service.is_configured():
            result = openai_service.generate(prompt, LEGAL_SYSTEM_PROMPT)
        else:
            # Default: Ollama
            result = ollama_service.generate(prompt, LEGAL_SYSTEM_PROMPT)

        if result and result.get("success"):
            return {
                "answer": result["response"],
                "provider": chosen_provider,
                "model": result.get("model", "local"),
                "fallback_used": False
            }

        # If Ollama is offline or generation failed, provide grounded knowledge-base synthesis
        logger.info(f"AI provider '{chosen_provider}' unavailable. Using verified knowledge base grounded response.")
        fallback_answer = self._synthesize_grounded_fallback(query, retrieved_sources, target_lang, result.get("error") if result else None)

        return {
            "answer": fallback_answer,
            "provider": f"{chosen_provider} (Knowledge Base Fallback)",
            "model": "grounded-kb-synthesizer",
            "fallback_used": True
        }

    def _synthesize_grounded_fallback(
        self,
        query: str,
        retrieved_sources: List[LegalRecord],
        target_lang: str,
        provider_error: Optional[str] = None
    ) -> str:
        """
        Creates an authentic, grounded legal explanation directly from verified knowledge-base
        entries when the local LLM is offline or busy.
        """
        notice_en = (
            "*[Note: Local Ollama service is currently offline or loading. "
            "Displaying verified statutory guidance directly from LegalSaathi's curated Indian legal database.]*\n\n"
        )
        notice_hi = (
            "*[नोट: स्थानीय ओलामा (Ollama) सेवा वर्तमान में ऑफलाइन है। "
            "लीगलसाथी के सत्यापित भारतीय कानूनी डेटाबेस से सीधा मार्गदर्शन नीचे प्रस्तुत है।]*\n\n"
        )
        notice_kn = (
            "*[ಸೂಚನೆ: ಸ್ಥಳೀಯ ಒಲಾಮಾ (Ollama) ಸೇವೆ ಪ್ರಸ್ತುತ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ. "
            "ಲೀಗಲ್‌ಸಾಥಿಯ ಪರಿಶೀಲಿಸಿದ ಭಾರತೀಯ ಕಾನೂನು ಡೇಟಾಬೇಸ್‌ನಿಂದ ನೇರ ಮಾರ್ಗದರ್ಶನ ಇಲ್ಲಿದೆ.]*\n\n"
        )

        if not retrieved_sources:
            if target_lang == "hi":
                return (
                    f"{notice_hi}"
                    "आपके प्रश्न से संबंधित कोई विशिष्ट धारा हमारे सत्यापित डेटाबेस में उपलब्ध नहीं है।\n\n"
                    "**मार्गदर्शन:**\n"
                    "- कृपया किसी योग्य अधिवक्ता या जिला विधिक सेवा प्राधिकरण (DLSA) से संपर्क करें।\n"
                    "- मुफ्त सरकारी कानूनी सहायता के लिए राष्ट्रीय हेल्पलाइन **15100** (NALSA) पर कॉल करें।"
                )
            elif target_lang == "kn":
                return (
                    f"{notice_kn}"
                    "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ನಿರ್ದಿಷ್ಟ ಕಾಯ್ದೆ ನಮ್ಮ ಪರಿಶೀಲಿಸಿದ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಲಭ್ಯವಿಲ್ಲ.\n\n"
                    "**ಮಾರ್ಗದರ್ಶನ:**\n"
                    "- ದಯವಿಟ್ಟು ಅರ್ಹ ವಕೀಲರನ್ನು ಅಥವಾ ಜಿಲ್ಲಾ ಕಾನೂನು ಸೇವೆಗಳ ಪ್ರಾಧಿಕಾರವನ್ನು (DLSA) ಸಂಪರ್ಕಿಸಿ.\n"
                    "- ಉಚಿತ ಕಾನೂನು ನೆರವಿಗಾಗಿ ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ **15100** (NALSA) ಗೆ ಕರೆ ಮಾಡಿ."
                )
            return (
                f"{notice_en}"
                "The verified legal knowledge base does not currently contain a specific statutory record matching this scenario.\n\n"
                "**Recommended Steps:**\n"
                "- Consult a qualified advocate or your local District Legal Services Authority (DLSA).\n"
                "- For free legal representation under the Legal Services Authorities Act, call NALSA Helpline **15100**."
            )

        top = retrieved_sources[0]
        if target_lang == "hi":
            explanation = top.simplified_explanation_hi or top.simplified_explanation
            return (
                f"{notice_hi}"
                f"### {top.title}\n\n"
                f"**लागू कानून:** {top.act_name} ({top.section_number})\n\n"
                f"**विवರಣ:**\n{explanation}\n\n"
                f"**प्रमुख कदम व समाधान:**\n"
                f"1. आप आधिकारिक पोर्टल **{top.official_source_name}** ({top.official_source_url}) पर शिकायत दर्ज कर सकते हैं।\n"
                f"2. आवश्यक सभी साक्ष्य (रसीद, पत्राचार, फोटो) सुरक्षित रखें।\n"
                f"3. किसी भी आपात स्थिति या मुफ्त कानूनी सहायता के लिए **15100** (NALSA) पर संपर्क करें।"
            )
        elif target_lang == "kn":
            explanation = top.simplified_explanation_kn or top.simplified_explanation
            return (
                f"{notice_kn}"
                f"### {top.title}\n\n"
                f"**ಅನ್ವಯವಾಗುವ ಕಾಯ್ದೆ:** {top.act_name} ({top.section_number})\n\n"
                f"**ವಿವರಣೆ:**\n{explanation}\n\n"
                f"**ಮುಖ್ಯ ಹಂತಗಳು ಮತ್ತು ಪರಿಹಾರ:**\n"
                f"1. ಅಧಿಕೃತ ಪೋರ್ಟಲ್ **{top.official_source_name}** ({top.official_source_url}) ಮೂಲಕ ದೂರು ಸಲ್ಲಿಸಬಹುದು.\n"
                f"2. ಎಲ್ಲಾ ದಾಖಲೆಗಳು, ರಸೀದಿಗಳು ಮತ್ತು ಸಾಕ್ಷ್ಯಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿರಿಸಿಕೊಳ್ಳಿ.\n"
                f"3. ಉಚಿತ ಕಾನೂನು ನೆರವಿಗಾಗಿ ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ **15100** (NALSA) ಸಂಪರ್ಕಿಸಿ."
            )

        return (
            f"{notice_en}"
            f"### {top.title}\n\n"
            f"**Applicable Law:** {top.act_name} — {top.section_number}\n\n"
            f"**Legal Explanation:**\n{top.simplified_explanation}\n\n"
            f"**Recommended Actionable Steps:**\n"
            f"1. You can access the official portal **{top.official_source_name}** at [{top.official_source_url}]({top.official_source_url}) for filing complaints or accessing certified records.\n"
            f"2. Preserve all written notices, transaction proofs, and communications.\n"
            f"3. For free government advocate assistance, contact the National Legal Services Authority (NALSA) at **15100**."
        )

ai_service = AIService()
