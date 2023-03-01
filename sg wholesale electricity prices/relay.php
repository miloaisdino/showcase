<?php
 
// Define getallheaders() in case that it doesn't already exist (e.g. Nginx, PHP-FPM, FastCGI)
// Taken from https://www.php.net/manual/en/function.getallheaders.php#84262
if (!function_exists('getallheaders')) { 
    function getallheaders() { 
       $headers = array (); 
       foreach ($_SERVER as $name => $value) { 
           if (substr($name, 0, 5) == 'HTTP_') { 
               $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
           } 
       } 
       return $headers; 
	   //return [];
    } 
} 
 
function reformat($headers) {
    foreach ($headers as $name => $value) {
        yield "$name: $value";
    }
}
//parse url params
//$url = base64_decode($_GET["path"]);
 
// Configuration parameters
//$proxied_url = $url;
$proxied_url = "https://www.emcsg.com";
$proxied_host = parse_url($proxied_url)['host'];
$final_url = $proxied_url . str_replace('/emc/relay.php','',$_SERVER['REQUEST_URI']);
//echo $final_url;
 
$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); 
 
// HTTP messages consist of a request line such as 'GET https://example.com/asdf HTTP/1.1'…
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_URL, $final_url);
 
// … a set of header fields…
//$request_headers = getallheaders();
$request_headers = [];
//$request_headers['Host'] = $proxied_host;
//$request_headers['X-Forwarded-Host'] = $_SERVER['SERVER_NAME'];
$request_headers = iterator_to_array(reformat($request_headers));
//var_dump($request_headers);
curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
 
// … and a message body.
$request_body = file_get_contents('php://input');
curl_setopt($ch, CURLOPT_POSTFIELDS, $request_body);
 
// Retrieve response headers in the same request as the body
// Taken from https://stackoverflow.com/a/41135574/3144403
$response_headers = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION,
    function($curl, $header) use (&$response_headers) {
        $len = strlen($header);
        $header = explode(':', $header, 2);
        if (count($header) < 2) // ignore invalid headers
          return $len;
 
        $response_headers[strtolower(trim($header[0]))][] = trim($header[1]);
 
        return $len;
    }
);
 
$response_body = curl_exec($ch);
$response_code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if($response_body == ''){
	sleep(3);
	header('Location:'.$_SERVER['PHP_SELF'].'?'.$_SERVER['QUERY_STRING']);
	die("Please try again.");
}

//$response_body = str_replace('/','~',$response_body);
$response_body = str_replace("/ChartServer/resources/scripts/jquery-3.4.1.min.js",'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js',$response_body);
$response_body = str_replace('<script type="text/javascript" src="/ChartServer/resources/scripts/drill-down.js"></script>','',$response_body);
$response_body = str_replace('<script type="text/javascript" src="/ChartServer/resources/scripts/filter.js"></script>','',$response_body);
$response_body = str_replace('<script type="text/javascript" src="/ChartServer/resources/scripts/portlet.js"></script>','',$response_body);
$response_body = str_replace('/ChartServer/resources/style/print.css','',$response_body);
$response_body = str_replace('/ChartServer/resources/images/emc-logo-print.jpg','',$response_body);
$response_body = str_replace('LoadFilters(portletName)','',$response_body);
$response_body = str_replace(".png",'.png?t='.time(),$response_body);
$response_body = str_replace("/ChartServer",'/emc/relay.php/ChartServer',$response_body);

// Set the appropriate response status code & headers
http_response_code($response_code);
foreach($response_headers as $name => $values)
    foreach($values as $value)
        header("$name: $value", false);
 
echo $response_body;