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


if(preg_match('/chartdata = (.*?)\;/s', $response, $matches)){
	$json = ''.$matches[1].'';
	$json = trim(preg_replace('/\s+/', ' ', $json)); //remove newlines
	$jsonpear = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
	$jsonarr = $jsonpear->decode($json);
	//$lines = json_decode($json, true);
	//var_dump($jsonarr);
	//var_dump($matches);
	$main = [];
	
	//$total = 0;
	$main = array_map('extract_vals', $jsonarr);
	
	//var_dump($main);
	
	
	//$avg = $total/48;
	//echo "Average USEP: $".number_format((float)$avg, 1, '.', ''); //1decimalplace
	
} else {
	sleep(3);
	header('Location:'.$_SERVER['PHP_SELF'].'?'.$_SERVER['QUERY_STRING']);
	die("Failed to fetch data.");
}

if($_GET['csv']){
			$list = [
		['Demand', 'USEP', 'BVP', 'LVP'],		
		];
	foreach($main as $rownum => $row){
		array_push($list, $row);
	}
	header('Content-Type: text/csv');
	echo array2csv($list);
} else {
	header('Content-Type: application/json');
	echo json_encode($main);
}

function extract_vals($string){
	$pObj = [];
	$kindarr = ['Demand', 'USEP', 'BVP', 'LVP'];
	foreach($kindarr as $kind){
		preg_match_all('/'.$kind.' (.*?)\ /s', $string, $match);
		$pObj[$kind] = $match[1][0];
	}
	return $pObj;
}

function array2csv($data, $delimiter = ',', $enclosure = '"', $escape_char = "\\")
{
    $f = fopen('php://memory', 'r+');
    foreach ($data as $item) {
        fputcsv($f, $item, $delimiter, $enclosure, $escape_char);
    }
    rewind($f);
    return stream_get_contents($f);
}

