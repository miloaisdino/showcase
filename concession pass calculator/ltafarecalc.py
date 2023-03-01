import requests
import constant
from datetime import datetime, time

def ltafarecalc(prevtrip, trip, svc2 = 0):
    loc1, loc2, svc = trip['EntryLocationId'], trip['ExitLocationId'], trip['BusServiceNo']
    if svc2: svc = svc2

    faretype = 30  # 30=adult, 40=student, 39=senior, 38=workfare, 37=pwd
    # if is first leg
    if trip['ptid'] == 1:
        if trip['ttype'] == "Bus":
            payload = f"fare={faretype}&from={loc1}&to={loc2}&tripInfo={constant.LTA_FARE_INIT_USI}&addTripInfo=0&bus={svc}"
            response = requests.request("POST", constant.LTA_FARE_BUS_URL, headers=constant.LTA_FARE_HEADER, data=payload)
        else:
            payload = f"fare={faretype}&from={loc1}&to={loc2}&tripInfo={constant.LTA_FARE_INIT_USI}&addTripInfo=0"
            response = requests.request("POST", constant.LTA_FARE_MRT_URL, headers=constant.LTA_FARE_HEADER, data=payload)
    else:  # if is transfer
        if trip['ttype'] == "Bus":
            payload = f"fare={faretype}&from={loc1}&to={loc2}&tripInfo={prevtrip['ltafarecalc']['tripInfo']}" \
                      f"&addTripInfo={prevtrip['ltafarecalc']['addTripInfo']}&bus={svc}"
            response = requests.request("POST", constant.LTA_FARE_BUS_URL, headers=constant.LTA_FARE_HEADER, data=payload)
        else:
            payload = f"fare={faretype}&from={loc1}&to={loc2}&tripInfo={prevtrip['ltafarecalc']['tripInfo']}" \
                      f"&addTripInfo={prevtrip['ltafarecalc']['addTripInfo']}"
            response = requests.request("POST", constant.LTA_FARE_MRT_URL, headers=constant.LTA_FARE_HEADER, data=payload)

    resobj = response.json()

    # check for failure and attempt retry
    if resobj['fare'] == "":
        print(resobj)
        print(trip)

        if "Miss Exit" in trip["TransactionType"]:
            return {'legfare': "%.2f" % float(trip['Fare']),
                    'legdist': 40.2,
                    'tripInfo': constant.LTA_FARE_INIT_USI,
                    'addTripInfo': 0}
        else:
            svc2 = int(''.join(c for c in svc if c.isdigit()))
            return ltafarecalc(prevtrip, trip, svc2)


    # apply max 50cent 7.45am discount
    if trip['ttype'] == "Rail" and datetime.strptime(trip['EntryTransactionDate'].split('T', 1)[1], "%H:%M:%S").time() \
            < time(7, 45, 0):
        resobj['fare'] = int(resobj['fare']) - min(int(resobj['fare']), 50)


    legfare = "%.2f" % float(int(resobj['fare'])/100)
    legdist = "%.1f" % float(int(resobj['distance'])/100)
    tripInfo = resobj['tripInfo']
    addTripInfo = resobj['addTripInfo']

    return { 'legfare': legfare,
             'legdist': legdist,
             'tripInfo': tripInfo,
             'addTripInfo': addTripInfo}
