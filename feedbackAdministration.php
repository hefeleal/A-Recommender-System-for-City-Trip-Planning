<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Recommender System feedback</title>
		<style>
		body {
			margin: 0;
			font-size: 11px;
			font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
		}
		.commentCellDiv {
			text-align: left;
			word-wrap: break-word;
			max-height: 150px;
			overflow: auto;
		}
		.commentCell {
			width: 300px;
		}
		@media (min-width: 1500px){
			body {
				font-size: 13px;
			}
			.commentCell {
				max-width: 220px;
			}
		}
		table {
			text-align: center;
			width: 100%;
		}
		tr:nth-child(even) {
		    background-color: #CECECE;
		}
		tr:nth-child(odd) {
		    background-color: #EEEEEE;
		}
		th, tfoot td {
		    background-color: #16C218;
			font-weight: bold;
		}
		p {
			font-size: 15px;
			margin-left: 10px;
		}
		</style>
	</head>
	<body>
	<p>pageviews: <?php echo file_get_contents('pageviews.txt'); ?>, 
		requests: <?php echo file_get_contents('requests.txt'); ?></p>
<?php

$db = pg_connect('host=localhost dbname=recommendersystem user=recommendersystem password=XXXXXXXXXXXXXX')
	or die('Could not connect: ' . pg_last_error());
//pg_set_client_encoding('UTF8');
//resetTable();
showSummaryTable();
pg_close($db);


function resetTable(){
	echo "are you sure?";
	//dropTable();
	//createTable();
}

function dropTable(){
	echo "are you sure?";
	//$query = 'DROP TABLE feedback;';
	//pg_query($query) or die('DROP-Query failed: ' . pg_last_error());
}

function createTable(){
	$query = 'CREATE TABLE feedback(
		ID SERIAL PRIMARY KEY NOT NULL,
		timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		sPos point NOT NULL,
		sString TEXT NOT NULL,
		dPos point NOT NULL,
		dString TEXT NOT NULL,
		artPref INT NOT NULL,
		nightlifePref INT NOT NULL,
		foodPref INT NOT NULL,
		naturePref INT NOT NULL,
		musicPref INT NOT NULL,
		shoppingPref INT NOT NULL,
		algorithm INT NOT NULL,
		timeConstraint INT,
		budgetConstraint INT,
		amountOfPlaces0 INT NOT NULL,
		amountOfPlaces1 INT NOT NULL,
		totalAmountOfPlaces0 INT NOT NULL,
		totalAmountOfPlaces1 INT NOT NULL,
		walkingDistance0 INT NOT NULL,
		walkingDistance1 INT NOT NULL,
		directDistance INT NOT NULL,
		idOfBlueRoute INT NOT NULL,
		validUpdateUICalls INT NOT NULL,
		validSendFeedbackCalls INT NOT NULL,
		usingCurrentPosition BOOLEAN NOT NULL,
		rAmountOfPlaces0 INT NOT NULL,
		rPathLength0 INT NOT NULL,
		rMatchPrefs0 INT NOT NULL,
		rTakeRouteYourself0 INT NOT NULL,
		rOverall0 INT NOT NULL,
		rAmountOfPlaces1 INT NOT NULL,
		rPathLength1 INT NOT NULL,
		rMatchPrefs1 INT NOT NULL,
		rTakeRouteYourself1 INT NOT NULL,
		rOverall1 INT NOT NULL,
		rLikeBetter INT NOT NULL,
		comment TEXT
	);';
	pg_query($query) or die('CREATE-Query failed: ' . pg_last_error());
}

function showTable(){
	$query = 'SELECT * FROM feedback;';
	$result = pg_query($query) or die('SHOW-Query failed: ' . pg_last_error());
	$table = "<table cellspacing='0' cellpadding='3'>";
	$table .= "<thead><tr>";
	$amountOfFields = pg_num_fields($result);
	for($i = 0; $i < $amountOfFields; $i++){
		$table .= "<th>" . pg_field_name($result, $i) . "</th>";
	}
	$table .= "</tr></thead><tbody>";
	while($row = pg_fetch_row($result)){
		$table .= "<tr>";
		foreach ($row as $item){
			if(is_null($item)){
				$table .= "<td>null</td>";
			}
			else{
				$table .= "<td>" . htmlspecialchars($item) . "</td>";
			}
		}
		$table .= "</tr>";
	}
	$table .= "</tbody></table>";
	echo $table;
}

function showSummaryTable(){
	$query = 'SELECT * FROM feedback ORDER BY id;';
	$result = pg_query($query) or die('SHOW-Query failed: ' . pg_last_error());
	$table = "<table cellspacing='0' cellpadding='3'>";
	$table .= "<thead><tr>";
	$columns = array("id", "time", "start", "end", "preferences", "alg", "placesB", "placesO", 
		"distB", "distO", "directDist", "blueRoute", "UI/feedback calls", "currentPos", "ratingBaseline", "ratingOwnImpl", "likeBetter", "comment");
	foreach($columns as $column){
		$table .= "<th>" . $column . "</th>";
	}

	$table .= "</tr></thead><tbody>";

	// summary-variables:
	$countRows = 0;
	$sumOfPrefs = array(0, 0, 0, 0, 0, 0);
	$countAlgs = array(0, 0);
	$sumOfPlaces = array(0, 0, 0, 0);
	$sumOfDists = array(0, 0, 0);
	$sumOfBlueRouteBaseline = 0;
	$sumOfUIFeedbackCalls = array(0, 0);
	$sumOfCurrentPos = 0;
	$sumOfRatingsBaseline = array(0, 0, 0, 0, 0);
	$sumOfRatingsOwnImpl = array(0, 0, 0, 0, 0);
	$countLikeBetter = array(0, 0, 0);
	while($row = pg_fetch_row($result)){
		$table .= "<tr>";
		$table .= "<td>" . $row[0] . "</td>"; // id
		$table .= "<td>" . date('d.m.Y H:i:s', strtotime($row[1])) . "</td>"; // date
		$table .= "<td>" . htmlspecialchars($row[3]) . "</td>"; // start
		$table .= "<td>" . htmlspecialchars($row[5]) . "</td>"; // end
		$table .= "<td>(" . $row[6]; // preferences
		$sumOfPrefs[0] += $row[6];
		for($i = 7; $i <= 11; $i++){
			$table .= ",&nbsp;" . $row[$i]; // preferences
			$sumOfPrefs[$i-6] += $row[$i];
		}
		$table .= ")</td>";
		$table .= "<td>";
		if($row[12] == 0){
			$table .= "cf"; // algorithm
			$countAlgs[0]++;
		}
		else{
			$table .= "cb (" . $row[13] . "min, " . $row[14] . "eur)"; // algorithm
			$countAlgs[1]++;
		}
		$table .= "</td>";
		$table .= "<td>" . $row[15] . "/" . $row[17] . "</td>"; // placesBaseline
		$table .= "<td>" . $row[16] . "/" . $row[18] . "</td>"; // placesOwnImpl
		for($i = 0; $i < 4; $i++){
			$sumOfPlaces[$i] += $row[$i+15];
		}
		$table .= "<td>" . $row[19] . "m</td>"; // distBaseline
		$table .= "<td>" . $row[20] . "m</td>"; // distOwnImpl
		$table .= "<td>" . $row[21] . "m</td>"; // directDist
		for($i = 0; $i < 3; $i++){
			$sumOfDists[$i] += $row[$i+19];
		}
		$table .= "<td>" . ($row[22]==0?"baseline":"ownImpl") . "</td>"; // blueRoute
		$sumOfBlueRouteBaseline += $row[22]==0?1:0;
		$table .= "<td>" . $row[23] . "/" . $row[24] . "</td>"; // UI/sendFeedback calls
		$sumOfUIFeedbackCalls[0] += $row[23];
		$sumOfUIFeedbackCalls[1] += $row[24];
		$table .= "<td>" . ($row[25]=='f'?'false':'true') . "</td>"; // usingCurrentPosition
		$sumOfCurrentPos += $row[25]=='f'?0:1;

		$table .= "<td>(" . $row[26]; // ratingBaseline
		$sumOfRatingsBaseline[0] += $row[26];
		for($i = 27; $i <= 30; $i++){
			$table .= ",&nbsp;" . $row[$i]; // ratingBaseline
			$sumOfRatingsBaseline[$i-26] += $row[$i];
		}
		$table .= ")</td>";
		$table .= "<td>(" . $row[31]; // ratingOwnImpl
		$sumOfRatingsOwnImpl[0] += $row[31];
		for($i = 32; $i <= 35; $i++){
			$table .= ",&nbsp;" . $row[$i]; // ratingOwnImpl
			$sumOfRatingsOwnImpl[$i-31] += $row[$i];
		}
		$table .= ")</td>";
		$table .= "<td>" . ($row[36]==2?"none":($row[36]==0?"baseline":"ownImpl")) . "</td>"; // likeBetter
		$countLikeBetter[$row[36]]++;
		$table .= "<td class='commentCell'><div class='commentCellDiv'>" . htmlspecialchars($row[37]) . "</div></td>"; // comment

		$countRows++;
	}
	$table .= "</tbody><tfoot><tr><td></td><td></td><td></td><td></td>";
	$table .= "<td>(" . number_format($sumOfPrefs[0]/$countRows, 1);
	for($i = 1; $i < 6; $i++){
		$table .= ", " . number_format($sumOfPrefs[$i]/$countRows, 1);
	}
	$table .= ")</td>";
	$table .= "<td>cf:&nbsp;" . $countAlgs[0] . ", cb:&nbsp;" . $countAlgs[1] . "</td>";
	$table .= "<td>" . number_format($sumOfPlaces[0]/$countRows, 1) . "/" . number_format($sumOfPlaces[2]/$countRows, 1) . "</td>";
	$table .= "<td>" . number_format($sumOfPlaces[1]/$countRows, 1) . "/" . number_format($sumOfPlaces[3]/$countRows, 1) . "</td>";
	$table .= "<td>" . number_format($sumOfDists[0]/$countRows, 1) . "</td>";
	$table .= "<td>" . number_format($sumOfDists[1]/$countRows, 1) . "</td>";
	$table .= "<td>" . number_format($sumOfDists[2]/$countRows, 1) . "</td>";
	$table .= "<td>baseline:&nbsp;" . $sumOfBlueRouteBaseline . " ownImpl:&nbsp;" . ($countRows - $sumOfBlueRouteBaseline) . "</td>";
	$table .= "<td>" . $sumOfUIFeedbackCalls[0] . "/" . $sumOfUIFeedbackCalls[1] . "</td>";
	$table .= "<td>" . $sumOfCurrentPos . "</td>";
	$table .= "<td>(" . number_format($sumOfRatingsBaseline[0]/$countRows, 1);
	for($i = 1; $i < 5; $i++){
		$table .= ", " . number_format($sumOfRatingsBaseline[$i]/$countRows, 1);
	}
	$table .= ")</td>";
	$table .= "<td>(" . number_format($sumOfRatingsOwnImpl[0]/$countRows, 1);
	for($i = 1; $i < 5; $i++){
		$table .= ", " . number_format($sumOfRatingsOwnImpl[$i]/$countRows, 1);
	}
	$table .= ")</td>";
	$table .= "<td>baseline:&nbsp;" . $countLikeBetter[0] . ", ownImpl:&nbsp;" . $countLikeBetter[1] . ", none:&nbsp;" . $countLikeBetter[2] . "</td>";

	$table .= "<td></td></tr></tfoot></table>";
	echo $table;
}

?>
	</body>
</html>