import re
from typing import Tuple, Optional

# ID Patterns
# Aadhaar: 12 digits
AADHAAR_PATTERN = re.compile(r"^\d{12}$")
# PAN: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
PAN_PATTERN = re.compile(r"^[A-Z]{5}\d{4}[A-Z]{1}$")
# Passport: typically 8 characters, alphanumeric
PASSPORT_PATTERN = re.compile(r"^[A-Z0-9]{8}$")

def validate_document_number(doc_type: str, number: Optional[str]) -> Tuple[bool, str]:
    """
    Validates the format of a document number based on its type.
    Returns (isValid, message).
    """
    if not number:
        return False, "Document number not detected."

    clean_num = number.replace(" ", "").replace("-", "").upper()

    if "Aadhaar" in doc_type:
        if AADHAAR_PATTERN.match(clean_num):
            return True, "Aadhaar format valid."
        return False, "Invalid Aadhaar format: must be 12 digits."

    if "PAN" in doc_type:
        if PAN_PATTERN.match(clean_num):
            return True, "PAN format valid."
        return False, "Invalid PAN format: must be 5 letters, 4 digits, 1 letter."

    if "Passport" in doc_type:
        if PASSPORT_PATTERN.match(clean_num):
            return True, "Passport format valid."
        return False, "Invalid Passport format."

    # Default for unknown types
    return True, "General format accepted."
