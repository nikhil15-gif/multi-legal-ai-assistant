"""
Emergency detection and verified official contact numbers for India.
"""

import re
from typing import Optional
from app.models.schemas import EmergencyContact

EMERGENCY_KEYWORDS = [
    r"\b(suicid|kill myself|end my life)\b",
    r"\b(rape|assault|being beaten|domestic violence emergency|killing me|attacked now)\b",
    r"\b(immediate danger|life threat|hostage|kidnap)\b",
    r"\b(urgent police|emergency help|call police)\b",
    r"\b(ಬೆದರಿಕೆ|ಹಲ್ಲೆ|ಜೀವ ಬೆದರಿಕೆ|ಆತ್ಮಹತ್ಯೆ)\b",
    r"\b(जान का खतरा|मारपीट|आत्महत्या|तुरंत मदद)\b",
]

OFFICIAL_HELPLINES = {
    "National Emergency Unified Number": "112",
    "Women in Distress Helpline": "1091 / 181",
    "National Cyber Crime Reporting Helpline": "1930",
    "Childline India": "1098",
    "NALSA Free Legal Aid Toll-Free": "15100",
    "National Consumer Helpline": "1915",
    "Senior Citizen Helpline": "14567"
}

def detect_emergency(text: str) -> Optional[EmergencyContact]:
    if not text:
        return None

    text_lower = text.lower()
    for pattern in EMERGENCY_KEYWORDS:
        if re.search(pattern, text_lower):
            return EmergencyContact(
                is_emergency=True,
                title="URGENT SAFETY ALERT - IMMEDIATE ASSISTANCE",
                helplines={
                    "National Emergency (Police/Fire/Ambulance)": "112",
                    "Women Helpline": "1091 (or 181)",
                    "National Cyber Crime": "1930",
                    "National Legal Services Authority (NALSA)": "15100"
                },
                guidance=(
                    "If you or someone else is in immediate physical danger, facing violence, or in distress, "
                    "please call 112 immediately. Do not rely on AI for real-time emergency rescue. "
                    "All official helplines listed above are toll-free 24x7 government services."
                )
            )
    return None
