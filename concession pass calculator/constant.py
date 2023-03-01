LTA_FARE_HEADER = {
  'authority': 'www.lta.gov.sg',
  'accept': '*/*',
  'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,ms;q=0.6,ca;q=0.5',
  'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'origin': 'https://www.lta.gov.sg',
  'pragma': 'no-cache',
  'referer': 'https://www.lta.gov.sg/content/ltagov/en/map/fare-calculator.html',
  'sec-ch-ua': '"Google Chrome";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/107.0.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest'
}

LTA_FARE_INIT_USI = 'usiAccumulatedDistance1=0-usiAccumulatedDistance2=0-usiAccumulatedDistance3=0' \
                    '-usiAccumulatedDistance4=0-usiAccumulatedDistance5=0-usiAccumulatedDistance6=0' \
                    '-usiAccumulatedFare1=0-usiAccumulatedFare2=0-usiAccumulatedFare3=0-usiAccumulatedFare4=0' \
                    '-usiAccumulatedFare5=0-usiAccumulatedFare6=0'

LTA_FARE_BUS_URL = \
    "https://www.lta.gov.sg/content/ltagov/en/map/fare-calculator/jcr:content/map2-content/farecalculator.busget.html"

LTA_FARE_MRT_URL = \
    "https://www.lta.gov.sg/content/ltagov/en/map/fare-calculator/jcr:content/map2-content/farecalculator.mrtget.html"

LTA_MRT_TAP_OUT = ["Tampines", "Bukit Panjang", "Newton"]