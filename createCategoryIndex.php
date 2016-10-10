<?php
/*echo "Creating categories-file...";
ob_flush();
flush();
$arr = array();
createCategoryIndex();
echo "<br>Done!";*/

function createCategoryIndex(){
	global $arr;
	$CLIENT_ID = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
	$CLIENT_SECRET = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
	$json = file_get_contents("https://api.foursquare.com/v2/venues/categories?client_id=" . $CLIENT_ID 
		. "&client_secret=" . $CLIENT_SECRET . "&v=20150601");
	$decoded = json_decode($json);
	$cats = $decoded->response->categories;

	foreach($cats as $cat){
		addAllSubCategories($cat, $cat->id, $cat->name);
	}

	$file = fopen("categories.json", "w");
	fwrite($file, json_encode($arr, JSON_FORCE_OBJECT));
	fclose($file);
}

function addAllSubCategories($currentCategory, $parentCatID, $parentCatName){
	global $arr;
	$arr[$currentCategory->id] = array(
		"parentCatID" => $parentCatID,
		"parentCatName" => $parentCatName,
		"catName" => $currentCategory->name
	);

	$subcats = $currentCategory->categories;
	if(!is_null($subcats)){
		foreach($subcats as $subcat){
			addAllSubCategories($subcat, $parentCatID, $parentCatName);
		}
	}
}

?>