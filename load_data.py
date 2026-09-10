import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = "https://jobs-api14.p.rapidapi.com/v2/linkedin/search"

querystring = {"datePosted":"month","organizationIds":"1441","employmentTypes":"contractor;fulltime;parttime;intern;temporary","workplaceTypes":"remote;hybrid;onSite","experienceLevels":"intern;entry;associate;midSenior;director","location":"Worldwide","query":"java"}

headers = {
    "x-rapidapi-key": os.getenv("JOB_SEARCH_API"),
    "x-rapidapi-host": "jobs-api14.p.rapidapi.com"
}

try:
    response = requests.get(
        url,
        headers=headers,
        params=querystring,
        timeout=30
    )

    print("Request URL:", response.request.url)
    print("Status:", response.status_code)
    print("Response:", response.text)

    data = response.json()

except requests.exceptions.RequestException as e:
    print("HTTP error:", e)


print(type(data))


