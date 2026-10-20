import json
import sys
from pypdf import PdfReader

def inspect_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    pages_text = []
    body_parts = []
    links = []

    for page in reader.pages:
        pages_text.append(page.extract_text() or "")
        # Exclude running headers/footers when comparing content spanning pages.
        # Herald's body uses 45pt margins; retain the full text separately above.
        def collect_body(text, cm, tm, font, size):
            if 40 < tm[5] < float(page.mediabox.height) - 32:
                body_parts.append(text)
        page.extract_text(visitor_text=collect_body)
        if "/Annots" in page:
            for annot_ref in page["/Annots"]:
                try:
                    annot = annot_ref.get_object()
                    if annot.get("/Subtype") == "/Link" and "/A" in annot:
                        action = annot["/A"].get_object()
                        uri = action.get("/URI")
                        if uri:
                            links.append(str(uri))
                except Exception:
                    pass

    full_text = " ".join(pages_text)
    return {
        "num_pages": len(reader.pages),
        "full_text": full_text,
        "body_text": " ".join(body_parts),
        "links": links
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No PDF path provided"}))
        sys.exit(1)
    result = inspect_pdf(sys.argv[1])
    print(json.dumps(result))
