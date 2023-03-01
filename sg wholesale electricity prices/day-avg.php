<?php
require_once 'JSON.php';

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'http://localhost/emc/relay.php/ChartServer/blue/C1/600,400/',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
));

$response = curl_exec($curl);

curl_close($curl);
//var_dump($response);
//echo 'Curl error: ' . curl_error($ch);


if(preg_match('/chartdata = {(.*?)\}/s', $response, $matches)){
	//$json = '{'.$matches[1].'}';
	//$json = trim(preg_replace('/\s+/', ' ', $json)); //remove newlines
	//$jsonpear = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
	//$jsonarr = $jsonpear->decode($json);
	//$lines = json_decode($json, true);
	//var_dump($jsonarr);
	//$USEP = [];
	$total = 0;
	preg_match_all('/USEP (.*?)\ /s', $response, $matches);
	foreach($matches[1] as $period => $price){
		//array_push($USEP, $price);
		$total += $price;
	}
	//var_dump($USEP);
	$avg = $total/48;
	echo "Current Day Average: $".number_format((float)$avg, 1, '.', ''); //1decimalplace
	
} else {
	sleep(3);
	header('Location:'.$_SERVER['PHP_SELF'].'?'.$_SERVER['QUERY_STRING']);
	die("Failed to fetch data.");
}