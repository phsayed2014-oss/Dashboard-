"""Tests for normalize + splitDS logic."""
from pharmaops.parser.normalize import normalize_row, normalize_section, normalize_status
from pharmaops.parser.pdf_oracle import split_doctor_section


def test_normalize_row_arabic_keys():
    raw = {
        "اسم الطبيب": "د. أحمد",
        "اسم الخدمة": "XYLOMET Nasal Spray",
        "الحالة": "Closed",
    }
    row = normalize_row(raw)
    assert row is not None
    assert row["doctor"] == "د. أحمد"
    assert row["service"] == "XYLOMET Nasal Spray"
    assert row["status"] == "Closed"


def test_normalize_row_nbsp():
    raw = {"DoctorName": "Dr\u00a0Ali", "ServiceName": "Panadol"}
    row = normalize_row(raw)
    assert row["doctor"] == "Dr Ali"


def test_normalize_status_variants():
    assert normalize_status("CLOSED") == "Closed"
    assert normalize_status("Canceled") == "Canceled"
    assert normalize_status("NEW RX") == "New"


def test_normalize_section_typo():
    assert normalize_section("OPTHALMOLOGY") == "OPHTHALMOLOGY"


def test_split_fused_doctor_section():
    ds = split_doctor_section("AbdelmoneemGENERAL MEDICINE")
    assert "Abdelmoneem" in ds["doctor"]
    assert "GENERAL" in ds["section"]


def test_split_standalone_section():
    ds = split_doctor_section("Mohamed Hassan CARDIOLOGY")
    assert ds["doctor"] == "Mohamed Hassan"
    assert ds["section"] == "CARDIOLOGY"
