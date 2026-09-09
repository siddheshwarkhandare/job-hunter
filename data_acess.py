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

