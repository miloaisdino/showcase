import simplygo
import re
import constant
from ltafarecalc import ltafarecalc
from prettytable import PrettyTable
from datetime import datetime, timedelta

from pprint import pprint
rider = simplygo.Ride('email@gmail.com', '<password here>')
# pprint(rider.get_card_info()) # returns cardid list

cardid = 'xxxxxxx'
startdate = '01-12-2022'
enddate = '31-12-2022'
bcpemu = 1  # if bcpemu == 1 then pfare is discounted. if bcpemu == 0 then pfare is full fare
savecsv = 0

jid = 0  # same journey on TL server will have same jid
pjid = 1  # same journey based on non-concession assumption
xtime = object()  # time between prev leg in td object
mtime = object()  # total elapsed nc journey time at boarding in td object

prevtrip = {}
ptid = 1
pfare = 0.00

totalpf = 0.0
totalf = 0.0
totald = 0.0

print("Getting travel history...")

x = rider.get_transactions(cardid, startdate, enddate)

print("Done!")
print("Computing fares...")

# pid
t = PrettyTable(['pid', 'sid', 'type', 'svc', 'passusage',
                 'fare', 'pfare', 'disc',
                 'time1', 'code1', 'name1',
                 'time2', 'code2', 'name2',
                 'loc1', 'loc2', 'dist'
                 ])
# t = PrettyTable(['snd', 'type', 'svc', 'dir', 'fare', 'disc', 'time1'])
for bunch in reversed(x['Histories']):
    if 'Trips' in bunch:
        for trip in bunch['Trips']:
            if 'Bus' in trip['TransactionType']:
                trip['ttype'] = 'Bus'
            elif 'Rail' in trip['TransactionType']:
                trip['ttype'] = 'Rail'
            else:
                trip['ttype'] = trip['TransactionType']
                continue

            if trip['Fare'] == "Pass Usage" or trip['PassUsage'] == "1":
                trip['passusage'] = 1
                trip['Fare'] = 0.00
            else:
                trip['passusage'] = 0
                trip['Fare'] = float(trip['Fare'].replace("$", ""))

            if trip['No'] == 1:  # if is first server leg
                jid += 1  # assign new journey

            if ptid == 1:  # if is first leg
                xtime = timedelta(seconds=0)  # no prev leg to compare
                mtime = timedelta(seconds=0)  # total elapsed at boarding=0
            else:
                # 2nd row onwards
                xtime = datetime.strptime(trip['EntryTransactionDate'], "%Y-%m-%dT%H:%M:%S") - \
                        datetime.strptime(prevtrip['ExitTransactionDate'], "%Y-%m-%dT%H:%M:%S")
                mtime += datetime.strptime(trip['EntryTransactionDate'], "%Y-%m-%dT%H:%M:%S") - \
                        datetime.strptime(prevtrip['EntryTransactionDate'], "%Y-%m-%dT%H:%M:%S")

                # Transfer logic
                if prevtrip['ttype'] == trip['ttype'] == 'Rail':
                    cutoff = 15 * 60
                else:
                    cutoff = 45 * 60
                # if prevtrip['ttype'] == trip['ttype'] == 'Bus':
                #    print(int(re.search(r'\d+', prevtrip['BusServiceNo']).group()))

                # conditions for breaking a transfer
                if ((xtime.total_seconds() > cutoff or mtime.total_seconds() > 2 * 60 * 60)  # exceed time cutoff
                        or (bcpemu == 1)
                            # bcpemu break all bus (free) except rail-rail transfers (which should be separate anyway)
                        or (prevtrip['ttype'] == trip['ttype'] == 'Bus' and
                            int(re.search(r'\d+', prevtrip['BusServiceNo']).group())  # same base svc bus no
                            == int(re.search(r'\d+', trip['BusServiceNo']).group()))
                        or (prevtrip['ttype'] == trip['ttype'] == 'Rail' and
                            trip['EntryLocationId'] == prevtrip['ExitLocationId'] and  # reentry to same stn
                            prevtrip['ExitLocationName'] not in constant.LTA_MRT_TAP_OUT)  # whitelist mrt transfers
                        or (ptid > 6)):
                    # make new journey if exceed transfer cutoff, or same service, or same station
                    # and don't make a new journey if missing tap-out but obvious
                    # this codes cancels the transfer eligibility
                    pjid += 1
                    ptid = 1
                    mtime = timedelta(seconds=0)
                    # xtime is kept for reference

            # Pseudo fare
            # print(f"{trip['EntryTransactionDate']} - {trip['BusServiceNo']}")
            trip['pjid'] = pjid
            trip['ptid'] = ptid
            trip['ltafarecalc'] = ltafarecalc(prevtrip, trip)
            pfare = float(trip['ltafarecalc']['legfare'])
            legdist = float(trip['ltafarecalc']['legdist'])

            # more bcpemu stuff
            if bcpemu == 1 and trip['ttype'] == 'Bus': pfare = 0.00
            # if bcpemu == 1: pfare, trip['Fare'] = trip['Fare'], pfare  # swap positions

            # pid
            t.add_row([f"{pjid}.{ptid}", f"{jid}.{trip['No']}", trip['ttype'], trip['BusServiceNo'], trip['passusage'],
                       trip['Fare'], pfare, trip['Discount'],
                       trip['EntryTransactionDate'], trip['OriBoardingBusStopCode'], trip['EntryLocationName'],
                       trip['ExitTransactionDate'], trip['OriAlightingBusStopCode'], trip['ExitLocationName'],
                       trip['EntryLocationId'], trip['ExitLocationId'], trip['ltafarecalc']['legdist']
                       ])
            # debug progress
            # print(f'{pjid}.{ptid}  {mtime.total_seconds()}')
            # finally save
            totalf += trip['Fare']
            totalpf += pfare
            totald += legdist
            ptid += 1
            prevtrip = trip

print("Done!")
if savecsv:
    with open('./csv/simplygo-'+cardid+' '+startdate+' to '+enddate+' b'+str(bcpemu)+'.csv', 'w', newline='') as f_output:
        f_output.write(t.get_csv_string())
print(t)
print(f"Total fare: ${totalf:.2f}")
print(f"Total pfare: ${totalpf:.2f}")
print(f"Avg fare/journey: ${totalf/jid:.2f}")
print(f"Avg pfare/journey: ${totalpf/pjid:.2f}")
print()
print(f"Total dist: {totald:.1f}km")
# pprint(x)
# pprint(rider.get_transactions_this_month())
