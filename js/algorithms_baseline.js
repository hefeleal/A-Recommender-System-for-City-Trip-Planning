var baseline = baseline || {}; // declaring a namespace.

baseline.queue;
baseline.sourceNode, baseline.destinationNode;
baseline.walkingTime;

baseline.compareByOverallTime = function(a, b){ return a.overallTime - b.overallTime; };
baseline.compareByDistanceFromSource = function(a, b){ return a.distanceFromSource - b.distanceFromSource; };

baseline.constraintFreeAlgorithm = function(places, source_marker, destination_marker){
	baseline.createNodes(places, source_marker, destination_marker);
	baseline.createEdges(places, constraintFreeID);
	// initialize queue:
	baseline.queue = [];
	baseline.queue.push(baseline.sourceNode);

	// compute path
	while(baseline.queue.length > 0){
		var currentNode = baseline.queue.shift();
		currentNode.explored = true;
		for(var i = 0; i < currentNode.adjacencyList.length; i++){
			var targetNode = places[currentNode.adjacencyList[i].targetID];
			if(!targetNode.explored){
				var distanceThroughCurrentNode = currentNode.minDistance + currentNode.adjacencyList[i].distance;
				var entertainmentThroughCurrentNode = currentNode.maxEntertainment + targetNode.scaledScore;
				if(entertainmentThroughCurrentNode/distanceThroughCurrentNode > targetNode.maxEntertainment/targetNode.minDistance){
					if(baseline.queue.indexOf(targetNode) > -1){
						baseline.queue.splice(baseline.queue.indexOf(targetNode), 1);
					}
					targetNode.minDistance = distanceThroughCurrentNode;
					targetNode.maxEntertainment = entertainmentThroughCurrentNode;
					targetNode.previousNodeID = places.indexOf(currentNode);
					insertSorted(baseline.queue, targetNode, baseline.compareByDistanceFromSource);
				}
			}
		}
	}
	
	// make array of the path we found
	var path = [];
	for(var current = baseline.destinationNode; current != null; current = places[current.previousNodeID]){
		path.unshift(current);
	}

	baseline.cleanupNodes(places);
	return path;
}

// additional place-attributes that the constraint-free-algorithm 
// didn't have: timeToSpend, costOfPlace, mapPath
// Also in Haris' implementation every edge has an attribute 'backwardsEdge',
// which is always true for every edge and never gets changed after the 
// edges have been created. That's why I removed it.
// Interestingly, this algorithm also doesn't use the explored-property
baseline.constraintBasedAlgorithm = function(places, source_marker, destination_marker, time, budget){
	baseline.assignTimeAndCost(places);
	baseline.createNodes(places, source_marker, destination_marker);
	baseline.createEdges(places, constraintBasedID);
	// initialize queue:
	baseline.queue = [];
	for(var i = 0; i < places.length; i++){
		if(places[i] != baseline.sourceNode){
			baseline.queue.push(places[i]);
		}
	}
	baseline.queue.sort(function(a, b){
		return a.distanceFromSource - b.distanceFromSource;
	});
	// algorithm:
	while(baseline.queue.length > 0){
		var currentNode = baseline.queue.shift();
		if(currentNode.scaledScore == 0){
			continue;
		}
		for(var i = 0; i < currentNode.adjacencyList.length; i++){
			var targetNode = places[currentNode.adjacencyList[i].targetID];
			if(targetNode == baseline.sourceNode){
				var pathObject = {
					maxEntertainment: currentNode.scaledScore,
					maxCost: currentNode.costOfPlace,
					path: [currentNode.adjacencyList[i].targetID, places.indexOf(currentNode)],
					overallTime: currentNode.adjacencyList[i].time + currentNode.timeToSpend
				};
				baseline.performComparisonSteps(time, budget, currentNode, pathObject);
			}
			else{
				var previousMapPath = targetNode.mapPath;
				for(var j = 0; j < previousMapPath.length; j++){
					if(predefinedCategoryStrings[currentNode.predefinedCategory] == 'food'){
						if(baseline.checkFoodConstraint(places, previousMapPath[j].path)){
							continue;
						}
					}
					else if(predefinedCategoryStrings[currentNode.predefinedCategory] == 'nightlife'){
						if(baseline.checkNightLifeConstraint(places, previousMapPath[j].path)){
							continue;
						}
					}
					var pathObject = {
						maxEntertainment: currentNode.scaledScore+previousMapPath[j].maxEntertainment,
						maxCost: currentNode.costOfPlace+previousMapPath[j].maxCost,
						path: previousMapPath[j].path.slice(0),
						overallTime: currentNode.adjacencyList[i].time + previousMapPath[j].overallTime + currentNode.timeToSpend
					};
					pathObject.path.push(places.indexOf(currentNode));
					baseline.performComparisonSteps(time, budget, currentNode, pathObject);
				}
			}
		}
	}

	var path = [];
	if(baseline.destinationNode.mapPath.length > 0){
		var destinationPathObject = baseline.destinationNode.mapPath[baseline.destinationNode.mapPath.length-1];
		var pathIDs = destinationPathObject.path;
		for(var i = 0; i < pathIDs.length; i++){
			path.push(places[pathIDs[i]]);
		}
		// calculate walking time:
		var totalTimeToSpend = 0;
		for(var i = 0; i < pathIDs.length; i++){
			totalTimeToSpend += places[pathIDs[i]].timeToSpend;
		}
		baseline.walkingTime = destinationPathObject.overallTime - totalTimeToSpend;
	}
	baseline.cleanupNodes(places);
	return path;
}

baseline.checkFoodConstraint = function(places, path){
	for(var i = 0; i < path.length; i++){
		if(predefinedCategoryStrings[places[path[i]].predefinedCategory] == 'food'){
			return true;
		}
	}
	return false;
}

baseline.checkNightLifeConstraint = function(places, path){
	for(var i = 0; i < path.length; i++){
		if(predefinedCategoryStrings[places[path[i]].predefinedCategory] == 'nightlife'){
			return true;
		}
	}
	return false;
}

baseline.performComparisonSteps = function(time, budget, currentNode, pathObject){
	if(pathObject.maxCost <= budget && pathObject.overallTime <= time){
		var indexOfValue = contains(currentNode, pathObject, baseline.compareByOverallTime);
		if(indexOfValue >= 0){
			if(pathObject.maxEntertainment > currentNode.mapPath[indexOfValue].maxEntertainment){
				removeSorted(currentNode.mapPath, pathObject); // remove duplicates
				insertSorted(currentNode.mapPath, pathObject, baseline.compareByOverallTime);
				baseline.findNextElement(currentNode, pathObject);
			}
		}
		else{
			if(baseline.findPreviousElement(currentNode, pathObject)){
				baseline.findNextElement(currentNode, pathObject);
			}
		}
	}
}

baseline.findNextElement = function(currentNode, pathObject){
	while(true){
		var nextElement = getNextValue(currentNode.mapPath, pathObject, baseline.compareByOverallTime);
		if(nextElement == null){
			return;
		}
		if(nextElement.maxEntertainment <= pathObject.maxEntertainment){
			removeSorted(currentNode.mapPath, nextElement);
		}
		else{
			return;
		}
	}
}

baseline.findPreviousElement = function(currentNode, pathObject){
	var previousElement = getPreviousValue(currentNode.mapPath, pathObject, baseline.compareByOverallTime);
	if(previousElement == null){
		insertSorted(currentNode.mapPath, pathObject, baseline.compareByOverallTime);
		return true;
	}
	if(previousElement.maxEntertainment < pathObject.maxEntertainment){
		insertSorted(currentNode.mapPath, pathObject, baseline.compareByOverallTime);
		return true;
	}
	return false;
}

baseline.createNodes = function(places, source_marker, destination_marker){
	// incorperate source and destination in the places-array:
	baseline.sourceNode = {
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
	baseline.destinationNode = {
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
	places.push(baseline.sourceNode);
	places.push(baseline.destinationNode);

	for(var i = 0; i < places.length; i++){
		places[i].adjacencyList = [];
		places[i].explored = false;
		places[i].minDistance = Number.MAX_VALUE;
		places[i].maxEntertainment = 0;
		places[i].distanceFromSource = distance(baseline.sourceNode.lat, baseline.sourceNode.lng, places[i].lat, places[i].lng, 'K');
		places[i].previousNodeID = null; // stores the index, not the object!
		places[i].mapPath = []; // I use a sorted list instead of a map. MUST ALWAYS BE SORTED!
	}
	baseline.sourceNode.minDistance = 0;
}

/*
	we also add the nodes to the baseline.queue here because we already make a
	separation between algorithms and we have a loop through all places.
	Adding them here 
*/
baseline.createEdges = function(places, algorithmID){
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
				if(i != j && places[i] != baseline.sourceNode){
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
baseline.cleanupNodes = function(places){
	places.splice(places.indexOf(baseline.sourceNode), 1);
	places.splice(places.indexOf(baseline.destinationNode), 1);
	for(var i = 0; i < places.length; i++){
		delete places[i].adjacencyList;
		delete places[i].explored;
		delete places[i].minDistance;
		delete places[i].maxEntertainment;
		delete places[i].distanceFromSource;
		delete places[i].previousNodeID;
		delete places[i].mapPath;
	}
}

baseline.assignTimeAndCost = function(places){
	for(var i = 0; i < places.length; i++){
		switch(places[i].predefinedCategory){
			case 0: 
				places[i].costOfPlace = 12;
				places[i].timeToSpend = 45;
				break;
			case 1: 
				places[i].costOfPlace = 10;
				places[i].timeToSpend = 60;
				break;
			case 2: 
				places[i].costOfPlace = 13;
				places[i].timeToSpend = 40;
				break;
			case 3: 
				places[i].costOfPlace = 5;
				places[i].timeToSpend = 45;
				break;
			case 4: 
				places[i].costOfPlace = 15;
				places[i].timeToSpend = 50;
				break;
			case 5: 
				places[i].costOfPlace = 0;
				places[i].timeToSpend = 60;
				break;
			default:
				places[i].costOfPlace = 200;
				places[i].timeToSpend = 200;
				break;
		}
	}
}