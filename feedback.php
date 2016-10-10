<?php

/*
	*0 are the fields for the baseline approach
	*1 are the fields for my own implementation

	table feedback:
	ID 						0
	timestamp           	28-5-15-12:57
	sPos					point
	sString					Marienplatz
	dPos					point
	dString					Hauptbahnhof
	artPref					1-5
	nightlifePref			1-5
	foodPref				1-5
	naturePref				1-5
	musicPref				1-5
	shoppingPref			1-5
	algorithm 				0-1
	timeConstraint			180
	budgetConstraint		100
	amountOfPlaces0 		20
	amountOfPlaces1 		40
	totalAmountOfPlaces0	175
	totalAmountOfPlaces1	160
	walkingDistance0		2200
	walkingDistance1		2540
	directDistance			1700
	idOfBlueRoute			0, 1
	validUpdateUICalls		1
	validSendFeedbackCalls	1
	usingCurrentPosition	false
	rAmountOfPlaces0		1-5
	rPathLength0			1-5
	rMatchPrefs0			1-5
	rTakeRouteYourself0		1-3
	rOverall0				1-5
	rAmountOfPlaces1		1-5
	rPathLength1			1-5
	rMatchPrefs1			1-5
	rTakeRouteYourself1		1-3
	rOverall1				1-5
	rLikeBetter				0, 1, 2 (none)
	comment 				text
 
*/
$statusReport;

$sLat = $_GET['sLat'];
$sLng = $_GET['sLng'];
$sString = $_GET['sString'];
$dLat = $_GET['dLat'];
$dLng = $_GET['dLng'];
$dString = $_GET['dString'];
$artPref = $_GET['artPref'];
$nightlifePref = $_GET['nightlifePref'];
$foodPref = $_GET['foodPref'];
$naturePref = $_GET['naturePref'];
$musicPref = $_GET['musicPref'];
$shoppingPref = $_GET['shoppingPref'];
$algorithm = $_GET['algorithm'];
$timeConstraint = $_GET['timeConstraint'] == "" ? null : $_GET['timeConstraint'];
$budgetConstraint = $_GET['budgetConstraint'] == "" ? null : $_GET['budgetConstraint'];
$amountOfPlaces0 = $_GET['amountOfPlaces0'];
$amountOfPlaces1 = $_GET['amountOfPlaces1'];
$totalAmountOfPlaces0 = $_GET['totalAmountOfPlaces0'];
$totalAmountOfPlaces1 = $_GET['totalAmountOfPlaces1'];
$walkingDistance0 = $_GET['walkingDistance0'];
$walkingDistance1 = $_GET['walkingDistance1'];
$directDistance = $_GET['directDistance'];
$idOfBlueRoute = $_GET['idOfBlueRoute'];
$validUpdateUICalls = $_GET['validUpdateUICalls'];
$validSendFeedbackCalls = $_GET['validSendFeedbackCalls'];
$usingCurrentPosition = $_GET['usingCurrentPosition'];
$rAmountOfPlaces0 = $_GET['rAmountOfPlaces0'];
$rPathLength0 = $_GET['rPathLength0'];
$rMatchPrefs0 = $_GET['rMatchPrefs0'];
$rTakeRouteYourself0 = $_GET['rTakeRouteYourself0'];
$rOverall0 = $_GET['rOverall0'];
$rAmountOfPlaces1 = $_GET['rAmountOfPlaces1'];
$rPathLength1 = $_GET['rPathLength1'];
$rMatchPrefs1 = $_GET['rMatchPrefs1'];
$rTakeRouteYourself1 = $_GET['rTakeRouteYourself1'];
$rOverall1 = $_GET['rOverall1'];
$rLikeBetter = $_GET['rLikeBetter'];
$comment = $_GET['comment'];

if(!empty($sLat)
	&& !empty($sLng)
	&& !empty($sString)
	&& !empty($dLat)
	&& !empty($dLng)
	&& !empty($dString)
	&& !is_null($artPref)
	&& !is_null($nightlifePref)
	&& !is_null($foodPref)
	&& !is_null($naturePref)
	&& !is_null($musicPref)
	&& !is_null($shoppingPref)
	&& !is_null($algorithm)
	&& !is_null($amountOfPlaces0)
	&& !is_null($amountOfPlaces1)
	&& !is_null($totalAmountOfPlaces0)
	&& !is_null($totalAmountOfPlaces1)
	&& !is_null($walkingDistance0)
	&& !is_null($walkingDistance1)
	&& !is_null($directDistance)
	&& !is_null($idOfBlueRoute)
	&& !is_null($validUpdateUICalls)
	&& !is_null($validSendFeedbackCalls)
	&& !is_null($usingCurrentPosition)
	&& !is_null($rAmountOfPlaces0)
	&& !is_null($rPathLength0)
	&& !is_null($rMatchPrefs0)
	&& !is_null($rTakeRouteYourself0)
	&& !is_null($rOverall0)
	&& !is_null($rAmountOfPlaces1)
	&& !is_null($rPathLength1)
	&& !is_null($rMatchPrefs1)
	&& !is_null($rTakeRouteYourself1)
	&& !is_null($rOverall1)
	&& !is_null($rLikeBetter)
	&& !is_null($comment)){
	$db = pg_connect('host=localhost dbname=recommendersystem user=recommendersystem password=XXXXXXXXXXXXXX');
	if(!$db){
		$statusReport = "Error while connecting to database";
	}
	else{
		//pg_set_client_encoding('UTF8');
		insert(
			$sLat,
			$sLng,
			$sString,
			$dLat,
			$dLng,
			$dString,
			$artPref,
			$nightlifePref,
			$foodPref,
			$naturePref,
			$musicPref,
			$shoppingPref,
			$algorithm,
			$timeConstraint,
			$budgetConstraint,
			$amountOfPlaces0,
			$amountOfPlaces1,
			$totalAmountOfPlaces0,
			$totalAmountOfPlaces1,
			$walkingDistance0,
			$walkingDistance1,
			$directDistance,
			$idOfBlueRoute,
			$validUpdateUICalls,
			$validSendFeedbackCalls,
			$usingCurrentPosition,
			$rAmountOfPlaces0,
			$rPathLength0,
			$rMatchPrefs0,
			$rTakeRouteYourself0,
			$rOverall0,
			$rAmountOfPlaces1,
			$rPathLength1,
			$rMatchPrefs1,
			$rTakeRouteYourself1,
			$rOverall1,
			$rLikeBetter,
			$comment);
		pg_close($db);
	}
}
else{
	$statusReport = "Error: Missing field";
}
echo $statusReport;


function insert(
	$sLat,
	$sLng,
	$sString,
	$dLat,
	$dLng,
	$dString,
	$artPref,
	$nightlifePref,
	$foodPref,
	$naturePref,
	$musicPref,
	$shoppingPref,
	$algorithm,
	$timeConstraint,
	$budgetConstraint,
	$amountOfPlaces0,
	$amountOfPlaces1,
	$totalAmountOfPlaces0,
	$totalAmountOfPlaces1,
	$walkingDistance0,
	$walkingDistance1,
	$directDistance,
	$idOfBlueRoute,
	$validUpdateUICalls,
	$validSendFeedbackCalls,
	$usingCurrentPosition,
	$rAmountOfPlaces0,
	$rPathLength0,
	$rMatchPrefs0,
	$rTakeRouteYourself0,
	$rOverall0,
	$rAmountOfPlaces1,
	$rPathLength1,
	$rMatchPrefs1,
	$rTakeRouteYourself1,
	$rOverall1,
	$rLikeBetter,
	$comment){
	global $statusReport;

	$query = 'INSERT INTO feedback(sPos,
		sString,
		dPos,
		dString,
		artPref,
		nightlifePref,
		foodPref,
		naturePref,
		musicPref,
		shoppingPref,
		algorithm,
		timeConstraint,
		budgetConstraint,
		amountOfPlaces0,
		amountOfPlaces1,
		totalAmountOfPlaces0,
		totalAmountOfPlaces1,
		walkingDistance0,
		walkingDistance1,
		directDistance,
		idOfBlueRoute,
		validUpdateUICalls,
		validSendFeedbackCalls,
		usingCurrentPosition,
		rAmountOfPlaces0,
		rPathLength0,
		rMatchPrefs0,
		rTakeRouteYourself0,
		rOverall0,
		rAmountOfPlaces1,
		rPathLength1,
		rMatchPrefs1,
		rTakeRouteYourself1,
		rOverall1,
		rLikeBetter,
		comment)
	VALUES(POINT($1, $2), $3, POINT($4, $5), $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38);';
	$result = pg_query_params($query, array(
		$sLat,
		$sLng,
		$sString,
		$dLat,
		$dLng,
		$dString,
		$artPref,
		$nightlifePref,
		$foodPref,
		$naturePref,
		$musicPref,
		$shoppingPref,
		$algorithm,
		$timeConstraint,
		$budgetConstraint,
		$amountOfPlaces0,
		$amountOfPlaces1,
		$totalAmountOfPlaces0,
		$totalAmountOfPlaces1,
		$walkingDistance0,
		$walkingDistance1,
		$directDistance,
		$idOfBlueRoute,
		$validUpdateUICalls,
		$validSendFeedbackCalls,
		$usingCurrentPosition,
		$rAmountOfPlaces0,
		$rPathLength0,
		$rMatchPrefs0,
		$rTakeRouteYourself0,
		$rOverall0,
		$rAmountOfPlaces1,
		$rPathLength1,
		$rMatchPrefs1,
		$rTakeRouteYourself1,
		$rOverall1,
		$rLikeBetter,
		$comment));
	if(!$result){
		$statusReport = "Error while executing query";
	}
	else{
		$statusReport = "ok";
	}
}
?>