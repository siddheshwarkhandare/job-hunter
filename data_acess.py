import pymupdf
'''
import os 
import json

with open ('data.txt', 'r') as file:
    content= file.read()
    print(type(content))

new_data =json.loads(content)

for i in new_data['data']:
    print(i['id'])
    print(i['linkedinUrl'])
    #print(i)
'''
import pymupdf

pdf_path = "Siddheshwar_Khandare_Resume.pdf"
output_path = "resume_data.txt"

doc = pymupdf.open(pdf_path)

with open(output_path, "w", encoding="utf-8") as out:
    for page_number, page in enumerate(doc, start=1):
        out.write(f"\n===== PAGE {page_number} =====\n")
        out.write(page.get_text())
        out.write("\n")

doc.close()

print("PDF data extracted successfully.")