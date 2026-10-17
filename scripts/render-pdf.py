import sys
import pypdfium2 as pdfium

def render_pdf_to_images(pdf_path, output_prefix):
    pdf = pdfium.PdfDocument(pdf_path)
    for i, page in enumerate(pdf):
        image = page.render(scale=2).to_pil()
        out_name = f"{output_prefix}_page_{i+1}.png"
        image.save(out_name)
        print(f"Rendered: {out_name}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python render-pdf.py <pdf_path> <output_prefix>")
        sys.exit(1)
    render_pdf_to_images(sys.argv[1], sys.argv[2])
