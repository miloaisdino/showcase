import requests
import constant
loc1,loc2,svc = 5270,4797,2

payload = f"fare=30&from={loc1}&to={loc2}&tripInfo={constant.LTA_FARE_INIT_USI}&addTripInfo=0&bus={svc}"
response = requests.request("POST", constant.LTA_FARE_BUS_URL, headers=constant.LTA_FARE_HEADER, data=payload)

print(response.text)
