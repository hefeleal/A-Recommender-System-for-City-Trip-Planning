<?php
$sLat = $_GET['sLat'];
$sLng = $_GET['sLng'];
$dLat = $_GET['dLat'];
$dLng = $_GET['dLng'];

if(!empty($sLat) && !empty($sLng) && !empty($dLat) && !empty($dLng)){
	$filename = 'requests.txt';
	$requests = file_get_contents($filename);
	$file = fopen($filename, 'w+');
	fwrite($file, $requests + 1);
	fclose($file);

	$truncated_json = explore($sLat, $sLng, $dLat, $dLng);
	echo $truncated_json;
}

/*
	adopted from Haris Iltifat
	This is all we're gonna do server-side. We have to execute this part of the explore-algorithm
	on the server because we don't want the client so see our foursquare-credentials. Also, we don't
	want to send the client the full json-file back which we receive from foursquare because it is
	really huge and we only need a small part of it. That is why we do the truncation
	server-side as well. The truncated json file is about 10% of the original size.
	However, everything else can and should be computed by the client.
*/
function explore($latSource, $lngSource, $latDestination, $lngDestination){
	$midPoint = midPoint($latSource, $lngSource, $latDestination, $lngDestination);
	$dist = ceil(distance($midPoint[0], $midPoint[1], $latSource, $lngSource, 'K') * 1000);
	$explorePlaces = foursquareExplore($midPoint[0], $midPoint[1], $dist*1.2, 200);
	return $explorePlaces;
}

/*
	adopted from Haris Iltifat
*/
function foursquareExplore($lat, $lng, $radius, $limit){
	$CLIENT_ID = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
	$CLIENT_SECRET = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

	$items = array();
	for($offset = 0; $offset < $limit; $offset += 100){
		$json = file_get_contents("https://api.foursquare.com/v2/venues/explore?client_id=" . $CLIENT_ID 
			. "&client_secret=" . $CLIENT_SECRET . "&v=20150601&radius=" . $radius . "&ll=" . $lat . "," 
			. $lng . "&limit=" . ($limit-$offset) . "&offset=". $offset);
		$decoded = json_decode($json);
		$items = array_merge($items, $decoded->response->groups[0]->items);
		if($offset == 0){
			$amountOfPlacesInBaselineApproach = count($items); // the baseline only has up to 100 places.
		}
		// This means we got less than 100 new results with this request and thus we won't get any new results 
		// if we keep on increasing the offset-parameter. This is when we can abort.
		if(count($items) < $offset+100){
			break;
		}
	}
	// now add some sights:
	$jsonSights = file_get_contents("https://api.foursquare.com/v2/venues/explore?client_id=" . $CLIENT_ID 
		. "&client_secret=" . $CLIENT_SECRET . "&v=20150601&radius=" . $radius . "&ll=" . $lat . "," 
		. $lng . "&limit=" . $limit . "&section=sights");
	$decodedSights = json_decode($jsonSights);
	$itemsSights = $decodedSights->response->groups[0]->items;
	foreach($itemsSights as $itemsSight){
		foreach($items as $item){
			if($item->venue->id == $itemsSight->venue->id){
				continue 2;
			}
		}
		array_push($items, $itemsSight);
	}


	// ATTENTION: Haris used venue->likes->count, which does not seem to exist at all. There is however 
	// a tips->likes->count, which we will use. Maybe the format of the json changed?
	$arr = array();
	$loopCounter = 0;
	foreach($items as $item){
		$entry = array(
			"id" => $item->venue->id,
			"name" => $item->venue->name,
			"lat" => $item->venue->location->lat,
			"lng" => $item->venue->location->lng,
			"categoryName" => $item->venue->categories[0]->name,
			"categoryID" => $item->venue->categories[0]->id,
			"checkinsCount" => $item->venue->stats->checkinsCount,
			"likes" => is_null($item->tips[0]->likes->count) ? 0 : $item->tips[0]->likes->count,
			"isOpen" => is_null($item->venue->hours->isOpen) ? "unknown" : $item->venue->hours->isOpen,
			"rating" => is_null($item->venue->rating) ? 0 : $item->venue->rating,
			"amountOfVotes" => is_null($item->venue->ratingSignals) ? 0 : $item->venue->ratingSignals,
			"hereNow" => is_null($item->venue->hereNow->count) ? 0 : $item->venue->hereNow->count,
			"priceTier" => is_null($item->venue->price->tier) ? 0 : $item->venue->price->tier,
			"isInBaselineApproach" => $loopCounter < $amountOfPlacesInBaselineApproach
		);
		array_push($arr, $entry);
		$loopCounter++;
	}
	
	//return json_encode($arr, JSON_UNESCAPED_UNICODE);
	return json_encode($arr);
}

// way worse than explore!
function foursquareSearch($lat, $lng, $radius, $limit){
	$CLIENT_ID = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
	$CLIENT_SECRET = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

	$json = file_get_contents("https://api.foursquare.com/v2/venues/search?client_id=" . $CLIENT_ID 
			. "&client_secret=" . $CLIENT_SECRET . "&v=20150601&radius=" . $radius . "&ll=" . $lat . "," 
			. $lng . "&limit=" . $limit . "&intent=browse");
	$decoded = json_decode($json);
	$items = $decoded->response->venues;

	$arr = array();
	foreach($items as $item){
		$entry = array(
			"id" => $item->id,
			"name" => $item->name,
			"lat" => $item->location->lat,
			"lng" => $item->location->lng,
			"categoryName" => $item->categories[0]->name,
			"categoryID" => $item->categories[0]->id,
			"checkinsCount" => $item->stats->checkinsCount,
			"likes" => is_null($item->tips[0]->likes->count) ? 0 : $item->tips[0]->likes->count,
			"isOpen" => is_null($item->hours->isOpen) ? "unknown" : $item->hours->isOpen,
			"rating" => is_null($item->rating) ? 0 : $item->rating,
			"amountOfVotes" => is_null($item->ratingSignals) ? 0 : $item->ratingSignals,
			"hereNow" => is_null($item->hereNow->count) ? 0 : $item->hereNow->count,
			"priceTier" => is_null($item->price->tier) ? 0 : $item->price->tier
		);
		array_push($arr, $entry);
	}

	return json_encode($arr);
}

/*
	adopted from Haris Iltifat
*/
function midPoint($latSource, $lngSource, $latDestination, $lngDestination){
	$dLon = deg2rad($lngDestination - $lngSource);
	$lat1 = deg2rad($latSource);
	$lat2 = deg2rad($latDestination);
	$lng1 = deg2rad($lngSource);

	$Bx = cos($lat2) * cos($dLon);
	$By = cos($lat2) * sin($dLon);
	$midPointLat = rad2deg(atan2(sin($lat1) + sin($lat2), sqrt((cos($lat1) + $Bx) * (cos($lat1) + $Bx) + $By * $By)));
	$midPointLng = rad2deg($lng1 + atan2($By, cos($lat1) + $Bx));
	return array ($midPointLat, $midPointLng);
}

/*
	adopted from Haris Iltifat
*/
function distance($latSource, $lngSource, $latDestination, $lngDestination, $unit){
	$theta = $lngSource - $lngDestination;
	$dist = sin(deg2rad($latSource)) * sin(deg2rad($latDestination)) + cos(deg2rad($latSource)) * cos(deg2rad($latDestination)) * cos(deg2rad($theta));
	$dist = rad2deg(acos($dist)) * 60 * 1.1515;
	if($unit == 'K'){
		$dist = $dist * 1.609344;
	} else if ($unit == 'N'){
		$dist = $dist * 0.8684;
	}
	return $dist;
}
?>