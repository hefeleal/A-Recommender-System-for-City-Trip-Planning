var ownImpl = ownImpl || {}; // declaring a namespace.

ownImpl.queue;
ownImpl.sourceNode, ownImpl.destinationNode;
ownImpl.walkingTime;
ownImpl.userPreferences;

ownImpl.compareByOverallTime = function(a, b){ return a.overallTime - b.overallTime; };
ownImpl.compareByDistanceFromSource = function(a, b){ return a.distanceFromSource - b.distanceFromSource; };

ownImpl.getUserPreferences = function(){
	var ret = [0, 0, 0, 0, 0, 0];
	for(var i = 0; i < 6; i++){
		ret[i] = parseInt($("input[name="+predefinedCategoryStrings[i]+"]:checked").val());
	}
	return ret;
}

ownImpl.constraintFreeAlgorithm = function(places, source_marker, destination_marker){
	ownImpl.userPreferences = ownImpl.getUserPreferences();

	ownImpl.createNodes(places, source_marker, destination_marker);
	ownImpl.createEdges(places, constraintFreeID);

	// initialize queue:
	ownImpl.queue = [];
	ownImpl.queue.push(ownImpl.sourceNode);

	// compute path
	while(ownImpl.queue.length > 0){
		var currentNode = ownImpl.queue.shift();
		currentNode.explored = true;
		for(var i = 0; i < currentNode.adjacencyList.length; i++){
			var targetNode = places[currentNode.adjacencyList[i].targetID];
			if(!targetNode.explored && targetNode.scaledScore > 0){
				var distanceThroughCurrentNode = currentNode.minDistance + currentNode.adjacencyList[i].distance;
				var entertainmentThroughCurrentNode = currentNode.maxEntertainment + targetNode.scaledScore;

				/*
				variables to consider:
				distanceThroughCurrentNode (as small as possible)
				entertainmentThroughCurrentNode (as big as possible)
				userPreferences (fixed; values between 0 and 5)
				{currentNode,targetNode}.categoriesInPathSoFar (should correlate with userPreferences)
				*/

				if(pearsonCoefficient(ownImpl.userPreferences, currentNode.categoriesInPathSoFar)*entertainmentThroughCurrentNode*entertainmentThroughCurrentNode/(distanceThroughCurrentNode*distanceThroughCurrentNode)
					>= pearsonCoefficient(ownImpl.userPreferences, targetNode.categoriesInPathSoFar)*targetNode.maxEntertainment*targetNode.maxEntertainment/(targetNode.minDistance*targetNode.minDistance)){
				
				/*
				// alternative approach (gives worse results, though):
				var relativeDistance = targetNode.distanceFromSource/ownImpl.destinationNode.distanceFromSource;
				var driftFactor = relativeDistance+1.5; // relativeDistance*2+1;
				if(entertainmentThroughCurrentNode > targetNode.maxEntertainment
					&& distanceThroughCurrentNode <= driftFactor*targetNode.distanceFromSource
					&& ( driftFactor*pearsonCoefficient(ownImpl.userPreferences, currentNode.categoriesInPathSoFar) >= 
						pearsonCoefficient(ownImpl.userPreferences, targetNode.categoriesInPathSoFar)
						)//|| pearsonCoefficient(ownImpl.userPreferences, currentNode.categoriesInPathSoFar) > 0.7)
				){
				*/

				// Haris' approach:
				///if(entertainmentThroughCurrentNode/distanceThroughCurrentNode >= targetNode.maxEntertainment/targetNode.minDistance){
					if(ownImpl.queue.indexOf(targetNode) > -1){
						ownImpl.queue.splice(ownImpl.queue.indexOf(targetNode), 1);
					}
					targetNode.minDistance = distanceThroughCurrentNode;
					targetNode.maxEntertainment = entertainmentThroughCurrentNode;
					targetNode.previousNodeID = places.indexOf(currentNode);
					targetNode.categoriesInPathSoFar = currentNode.categoriesInPathSoFar.slice(0);
					if(targetNode != ownImpl.destinationNode){
						targetNode.categoriesInPathSoFar[targetNode.predefinedCategory]++;
					}
					insertSorted(ownImpl.queue, targetNode, ownImpl.compareByDistanceFromSource);
				}
			}
		}
	}
	
	// make array of the path we found
	var path = [];
	for(var current = ownImpl.destinationNode; current != null; current = places[current.previousNodeID]){
		path.unshift(current);
	}

	ownImpl.cleanupNodes(places);
	return path;
}

// additional place-attributes that the constraint-free-algorithm 
// didn't have: timeToSpend, costOfPlace, mapPath
// Also in Haris' implementation every edge has an attribute 'backwardsEdge',
// which is always true for every edge and never gets changed after the 
// edges have been created. That's why I removed it.
// Interestingly, this algorithm also doesn't use the explored-property
ownImpl.constraintBasedAlgorithm = function(places, source_marker, destination_marker, time, budget){
	ownImpl.userPreferences = ownImpl.getUserPreferences();

	ownImpl.assignTimeAndCost(places);
	ownImpl.createNodes(places, source_marker, destination_marker);
	ownImpl.createEdges(places, constraintBasedID);
	// initialize queue:
	ownImpl.queue = [];
	for(var i = 0; i < places.length; i++){
		if(places[i] != ownImpl.sourceNode){
			ownImpl.queue.push(places[i]);
		}
	}
	ownImpl.queue.sort(function(a, b){
		return a.distanceFromSource - b.distanceFromSource;
	});
	// algorithm:
	while(ownImpl.queue.length > 0){
		var currentNode = ownImpl.queue.shift();
		if(currentNode.scaledScore == 0){
			continue;
		}
		for(var i = 0; i < currentNode.adjacencyList.length; i++){
			var targetNode = places[currentNode.adjacencyList[i].targetID];
			if(targetNode == ownImpl.sourceNode){
				var pathObject = {
					maxEntertainment: currentNode.scaledScore,
					maxCost: currentNode.costOfPlace,
					path: [currentNode.adjacencyList[i].targetID, places.indexOf(currentNode)],
					overallTime: currentNode.adjacencyList[i].time + currentNode.timeToSpend,
					categoriesInPathSoFar: [0, 0, 0, 0, 0, 0]
				};
				if(currentNode != ownImpl.destinationNode){
					pathObject.categoriesInPathSoFar[currentNode.predefinedCategory]++;
				}
				ownImpl.performComparisonSteps(time, budget, currentNode, pathObject);
			}
			else{
				var previousMapPath = targetNode.mapPath;
				for(var j = 0; j < previousMapPath.length; j++){
					if(predefinedCategoryStrings[currentNode.predefinedCategory] == 'food'){
						if(ownImpl.checkFoodConstraint(places, previousMapPath[j].path)){
							continue;
						}
					}
					else if(predefinedCategoryStrings[currentNode.predefinedCategory] == 'nightlife'){
						if(ownImpl.checkNightLifeConstraint(places, previousMapPath[j].path)){
							continue;
						}
					}
					var pathObject = {
						maxEntertainment: currentNode.scaledScore+previousMapPath[j].maxEntertainment,
						maxCost: currentNode.costOfPlace+previousMapPath[j].maxCost,
						path: previousMapPath[j].path.slice(0),
						overallTime: currentNode.adjacencyList[i].time + previousMapPath[j].overallTime + currentNode.timeToSpend,
						categoriesInPathSoFar: previousMapPath[j].categoriesInPathSoFar.slice(0)
					};
					if(currentNode != ownImpl.destinationNode){
						pathObject.categoriesInPathSoFar[currentNode.predefinedCategory]++;
					}
					pathObject.path.push(places.indexOf(currentNode));
					ownImpl.performComparisonSteps(time, budget, currentNode, pathObject);
				}
			}
		}
	}

	var path = [];
	if(ownImpl.destinationNode.mapPath.length > 0){
		var destinationPathObject = ownImpl.destinationNode.mapPath[ownImpl.destinationNode.mapPath.length-1];
		var pathIDs = destinationPathObject.path;
		for(var i = 0; i < pathIDs.length; i++){
			path.push(places[pathIDs[i]]);
		}
		// calculate walking time:
		var totalTimeToSpend = 0;
		for(var i = 0; i < pathIDs.length; i++){
			totalTimeToSpend += places[pathIDs[i]].timeToSpend;
		}
		ownImpl.walkingTime = destinationPathObject.overallTime - totalTimeToSpend;
	}
	ownImpl.cleanupNodes(places);
	return path;
}

ownImpl.checkFoodConstraint = function(places, path){
	for(var i = 0; i < path.length; i++){
		if(predefinedCategoryStrings[places[path[i]].predefinedCategory] == 'food'){
			return true;
		}
	}
	return false;
}

ownImpl.checkNightLifeConstraint = function(places, path){
	for(var i = 0; i < path.length; i++){
		if(predefinedCategoryStrings[places[path[i]].predefinedCategory] == 'nightlife'){
			return true;
		}
	}
	return false;
}

ownImpl.performComparisonSteps = function(time, budget, currentNode, pathObject){
	if(pathObject.maxCost <= budget && pathObject.overallTime <= time){
		var indexOfValue = contains(currentNode, pathObject, ownImpl.compareByOverallTime);
		if(indexOfValue >= 0){
			if(pearsonCoefficient(ownImpl.userPreferences, pathObject.categoriesInPathSoFar)*pathObject.maxEntertainment
				>= pearsonCoefficient(ownImpl.userPreferences,currentNode.mapPath[indexOfValue].categoriesInPathSoFar)*currentNode.mapPath[indexOfValue].maxEntertainment){
			// Haris' approach:
			//if(pathObject.maxEntertainment > currentNode.mapPath[indexOfValue].maxEntertainment){
				removeSorted(currentNode.mapPath, pathObject); // remove duplicates
				insertSorted(currentNode.mapPath, pathObject, ownImpl.compareByOverallTime);
				ownImpl.findNextElement(currentNode, pathObject);
			}
		}
		else{
			if(ownImpl.findPreviousElement(currentNode, pathObject)){
				ownImpl.findNextElement(currentNode, pathObject);
			}
		}
	}
}

ownImpl.findNextElement = function(currentNode, pathObject){
	while(true){
		var nextElement = getNextValue(currentNode.mapPath, pathObject, ownImpl.compareByOverallTime);
		if(nextElement == null){
			return;
		}
		if(pearsonCoefficient(ownImpl.userPreferences, pathObject.categoriesInPathSoFar)*pathObject.maxEntertainment
			>= pearsonCoefficient(ownImpl.userPreferences, nextElement.categoriesInPathSoFar)*nextElement.maxEntertainment){
			removeSorted(currentNode.mapPath, nextElement);
		}
		else{
			return;
		}
	}
}

ownImpl.findPreviousElement = function(currentNode, pathObject){
	var previousElement = getPreviousValue(currentNode.mapPath, pathObject, ownImpl.compareByOverallTime);
	if(previousElement == null){
		insertSorted(currentNode.mapPath, pathObject, ownImpl.compareByOverallTime);
		return true;
	}
	if(pearsonCoefficient(ownImpl.userPreferences, pathObject.categoriesInPathSoFar)*pathObject.maxEntertainment
		>= pearsonCoefficient(ownImpl.userPreferences, previousElement.categoriesInPathSoFar)*previousElement.maxEntertainment){
		insertSorted(currentNode.mapPath, pathObject, ownImpl.compareByOverallTime);
		return true;
	}
	return false;
}

ownImpl.createNodes = function(places, source_marker, destination_marker){
	// incorperate source and destination in the places-array:
	ownImpl.sourceNode = {
		name: source_marker.getTitle().slice(0, -" (drag to adjust position)".length),
		lat: source_marker.getPosition().lat(),
		lng: source_marker.getPosition().lng(),
		categoryName: "Starting point",
		predefinedCategory: predefinedCategoryStrings.indexOf('source'),
		hereNow: "",
		scaledScore: 1,
		costOfPlace: 0,
		timeToSpend: 0
	};
	ownImpl.destinationNode = {
		name: destination_marker.getTitle().slice(0, -" (drag to adjust position)".length),
		lat: destination_marker.getPosition().lat(),
		lng: destination_marker.getPosition().lng(),
		categoryName: "End point",
		predefinedCategory: predefinedCategoryStrings.indexOf('destination'),
		hereNow: "",
		scaledScore: 1,
		costOfPlace: 0,
		timeToSpend: 0
	};
	places.push(ownImpl.sourceNode);
	places.push(ownImpl.destinationNode);

	for(var i = 0; i < places.length; i++){
		places[i].adjacencyList = [];
		places[i].explored = false;
		places[i].minDistance = Number.MAX_VALUE;
		places[i].maxEntertainment = 0;
		places[i].distanceFromSource = distance(ownImpl.sourceNode.lat, ownImpl.sourceNode.lng, places[i].lat, places[i].lng, 'K');
		places[i].previousNodeID = null; // stores the index, not the object!
		places[i].mapPath = []; // I use a sorted list instead of a map. MUST ALWAYS BE SORTED!
		places[i].categoriesInPathSoFar = [0, 0, 0, 0, 0, 0]; // how many places of each category there are in the path.
	}
	ownImpl.sourceNode.minDistance = 0;
}

/*
	we also add the nodes to the ownImpl.queue here because we already make a
	separation between algorithms and we have a loop through all places.
	Adding them here 
*/
ownImpl.createEdges = function(places, algorithmID){
	if(algorithmID == constraintFreeID){
		// add all possible edges between places (the edges are undirected and weighted)
		// datastructure for storing the edges: adjacency list
		// also add some other variables for each node
		for(var i = 0; i < places.length; i++){
			for(var j = 0; j < places.length; j++){
				if(i != j){
					var e = {
						targetID: j,
						distance: distance(places[i].lat, places[i].lng, places[j].lat, places[j].lng, 'K')
					};
					places[i].adjacencyList.push(e);
				}
			}
		}
	}
	else if(algorithmID == constraintBasedID){
		for(var i = 0; i < places.length; i++){
			for(var j = 0; j < places.length; j++){
				if(i != j && places[i] != ownImpl.sourceNode){
					var distanceInMeters = distance(places[i].lat, places[i].lng, places[j].lat, places[j].lng, 'K') * 1000;
					var time = distanceInMeters / 74.07;
					var insertEdge = false;
					if(places[j].distanceFromSource < places[i].distanceFromSource){
						insertEdge = true;
					}
					else if(places[j].distanceFromSource == places[i].distanceFromSource){
						insertEdge = true;
						// only add an edge if an edge in the opposite direction has not already been added.
						for(var k = 0; k < places[j].adjacencyList.length; k++){
							if(places[j].adjacencyList[k].targetID == i){
								insertEdge = false;
								break;
							}
						}
					}
					if(insertEdge){
						e = {
							targetID: j,
							time: time
						};
						places[i].adjacencyList.push(e);
					}
				}
			}
		}
	}
}

// cleanup: delete node-attributes and remove Source&Destination-Entries.
ownImpl.cleanupNodes = function(places){
	places.splice(places.indexOf(ownImpl.sourceNode), 1);
	places.splice(places.indexOf(ownImpl.destinationNode), 1);
	for(var i = 0; i < places.length; i++){
		delete places[i].adjacencyList;
		delete places[i].explored;
		delete places[i].minDistance;
		delete places[i].maxEntertainment;
		delete places[i].distanceFromSource;
		delete places[i].previousNodeID;
		delete places[i].mapPath;
		delete places[i].categoriesInPathSoFar;
	}
}

/*
	we use Foursquare's price-rating which uses a scale from 1 to 4:
	"For food venues, in the United States, 1 is < $10 an entree, 
	2 is $10-$20 an entree, 3 is $20-$30 an entree, 4 is > $30 an entree."
*/
ownImpl.assignTimeAndCost = function(places){
	for(var i = 0; i < places.length; i++){
		if(places.hasOwnProperty("priceTier")){
			// 1: ca. 8€, 2: ca. 16€, 3: ca. 24€, 4: ca. 32€
			places[i].costOfPlace = places.priceTier * 8;
		}
		else{ // use this as a fallback.
			switch(places[i].predefinedCategory){
				case 0: 
					places[i].costOfPlace = 8;
					break;
				case 1: 
					places[i].costOfPlace = 15;
					break;
				case 2: 
					places[i].costOfPlace = 15;
					break;
				case 3: 
					places[i].costOfPlace = 5;
					break;
				case 4: 
					places[i].costOfPlace = 15;
					break;
				case 5: 
					places[i].costOfPlace = 10;
					break;
				default:
					places[i].costOfPlace = 10;
					break;
			}
		}
		switch(places[i].predefinedCategory){
			case 0: 
				places[i].timeToSpend = 60;
				break;
			case 1: 
				places[i].timeToSpend = 45;
				break;
			case 2: 
				places[i].timeToSpend = 45;
				break;
			case 3: 
				places[i].timeToSpend = 30;
				break;
			case 4: 
				places[i].timeToSpend = 50;
				break;
			case 5: 
				places[i].timeToSpend = 40;
				break;
			default:
				places[i].timeToSpend = 60;
				break;
		}
		if(places[i].predefinedCategory <= 5){ // not in the other-category
			// the higher the preference the longer the time to spend at a location.
			// maybe make the specific time values dependant on the category
			switch($("input[name="+predefinedCategoryStrings[places[i].predefinedCategory]+"]:checked").val()){
				case 1: places[i].timeToSpend -= 15;
				break;
				case 2: places[i].timeToSpend -= 5;
				break;
				case 4: places[i].timeToSpend += 5;
				break;
				case 5: places[i].timeToSpend += 15;
				break;
			}
		}
	}
}