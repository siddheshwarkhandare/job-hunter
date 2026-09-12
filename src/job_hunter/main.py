from fastapi import FastAPI, Request,UploadFile,File,HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from google import genai
from google.genai import types
from pathlib import Path
from dotenv import load_dotenv
import requests
import pymupdf
import json


import fitz 
import os

app = FastAPI()

Client = genai.Client(api_key="Api")

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




SYSTEM_PROMPT = (
    "You extract technical skills from resume text. "
    'Respond with ONLY a JSON object: {"skills": ["skill1", "skill2"]}. '
    "List specific technologies, languages, frameworks, and tools only — "
    "no soft skills, no sentences."
)
''''
async def geting_skill(resume_text: str):
    try:
        response = await Client.aio.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=f'{SYSTEM_PROMPT}\n\nResume text: \n{resume_text[:4000]}',
            config=types.GenerateContentConfig(response_mime_type="application/json"),

        )
        parsed = SkillsResult.model_validate(json.loads(response.text))
        return sorted({s.lower() for s in parsed.skills})

'''
