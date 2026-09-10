from fastapi import FastAPI, Request,UploadFile,File,HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
from dotenv import load_dotenv
import requests

import fitz 
import os

app = FastAPI()
BASE_DIR = Path(__file__).resolve().parent.parent.parent


load_dotenv()
JOB_SEARCH=os.getenv("JOB_SEARCH_API")



app.mount("/static", StaticFiles(directory=BASE_DIR/"static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR/"templates")


@app.get("/")
async def read_root(request: Request):
  return templates.TemplateResponse(request, "base.html", {"title": "Home"})



@app.post('/upload_pdf')
async def upload_pdf(file: UploadFile = File(...)):
    pdf_data = await file.read()

    # Real check — not just trusting the header the browser sent
    if not pdf_data.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF")

    try:
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read PDF contents")

    return {
        "filename": file.filename,
        "size": len(pdf_data),
        "text_preview": text[:500],
        "word_count": len(text.split()),
    }

