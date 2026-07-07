"""Row normalization — mirrors dashboard normalizeRow() exactly."""
from __future__ import annotations

import re
from typing import Any


def _clean(value: Any) -> str:
    if value is None or value == "":
        return ""
    text = str(value).replace("\u00a0", " ")
    return re.sub(r"\s+", " ", text).strip()


def normalize_row(raw: dict[str, Any]) -> dict[str, str] | None:
    key_map: dict[str, str] = {}
    for k in raw:
        key_map[re.sub(r"\s+", "", k).lower()] = k

    def get(*keys: str) -> str:
        for k in keys:
            src = key_map.get(k.lower())
            if src is not None:
                v = _clean(raw.get(src))
                if v:
                    return v
        return ""

    doctor = get("doctorname", "اسمالطبيب")
    service = get("servicename", "اسمالخدمة")
    section = get("sectionname", "اسمالقسم")
    patient = get("patientno", "رقمالمريض")
    patient_name = get("patientname", "اسمالمريض")
    order_no = get("orderno", "رقمالأمر")
    status = get("status", "الحالة")

    if not doctor and not service:
        return None

    return {
        "doctor": doctor,
        "service": service,
        "section": section,
        "patient": patient,
        "patientName": patient_name,
        "orderNo": order_no,
        "status": status,
    }


def normalize_status(status: str) -> str:
    su = (status or "").upper()
    if "CLOS" in su:
        return "Closed"
    if "CANC" in su:
        return "Canceled"
    if "NEW" in su:
        return "New"
    if "OPEN" in su:
        return "Opened"
    if "PEND" in su:
        return "Pending"
    return status or ""


def normalize_section(section: str) -> str:
    if not section:
        return ""
    return section.upper().replace("OPTHALMOLOGY", "OPHTHALMOLOGY")
