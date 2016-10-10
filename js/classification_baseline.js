var baseline = baseline || {}; // declaring a namespace.

baseline.filterByOpenPlaces = function(places){
	for(var i = 0; i < places.length; i++){
		if(places[i].isOpen != true && places[i].isOpen != "true"){ // "!places[i].isOpen" wouldn't work because the attribute can also be 'unknown'.
			places.splice(i, 1);
			i--;
		}
	}
}

/*
	based on the algorithm by Haris Iltifat
*/
baseline.categorize = function(places){
	var museumStrings = ["Museum", "Art Museum", "History", "Historic Site", "Art Gallery", "Arts", "Gallery"];
	var nightlifeStrings = ["Brewery", "Pub", "Bar", "Strip Club", "Nightclub"];
	var foodStrings = ["Restaurant", "cafe", "Pizza", "Coffee Shop", "Hotel", "Steakhouse"];
	var natureStrings = ["Garden", "Park"];
	var musicStrings = ["Entertainment", "Opera House", "Dance Studio", "Multiplex", "Theater", "Music", "Concert"];
	var shoppingStrings = ["City", "Landmark", "Mall", "Plaza", "Shopping"];

	for(var i = 0; i < places.length; i++){
		var categoriesString = places[i].categoryName;
		if(containsAny(categoriesString, museumStrings)){
			places[i].predefinedCategory = 0;
		}
		else if(containsAny(categoriesString, nightlifeStrings)){
			places[i].predefinedCategory = 1;
		}
		else if(containsAny(categoriesString, foodStrings)){
			places[i].predefinedCategory = 2;
		}
		else if(containsAny(categoriesString, natureStrings)){
			places[i].predefinedCategory = 3;
		}
		else if(containsAny(categoriesString, musicStrings)){
			places[i].predefinedCategory = 4;
		}
		else if(containsAny(categoriesString, shoppingStrings)){
			places[i].predefinedCategory = 5;
		}
		else{
			places[i].predefinedCategory = 6;
			//alert(categoriesString+" is in the other-category."); // for debugging purposes
		}
	}
}

/*
	based on the algorithm by Haris Iltifat
*/
baseline.scoreByMaxValues = function(places){
	var maxCheckins    = [0, 0, 0, 0, 0, 0, 0]; // stores the highest checkin-count for each category
	var maxLikes       = [0, 0, 0, 0, 0, 0, 0]; // stores the highest like-count for each category

	var amountOfPlaces = [0, 0, 0, 0, 0, 0, 0]; // how many places of each category there are in total
	var totalRatings   = [0, 0, 0, 0, 0, 0, 0]; // sum of all the ratings of each category
	var amountOfVotes  = [0, 0, 0, 0, 0, 0, 0]; // how many ratings there are for each category

	// determine maximum value for checkins and likes for each of the predefined categories,
	// and also fill out the other arrays we defined above.
	for(var i = 0; i < places.length; i++){
		for(var j = 0; j < predefinedCategoryStrings.length; j++){
			if(places[i].predefinedCategory == j){
				if(places[i].checkinsCount > maxCheckins[j]){
					maxCheckins[j] = places[i].checkinsCount;
				}
				if(places[i].likes > maxLikes[j]){
					maxLikes[j] = places[i].likes;
				}

				amountOfPlaces[j]++;
				totalRatings[j] += places[i].rating;
				amountOfVotes[j] += places[i].amountOfVotes;
				break;
			}
		}
	}
	var averageRatings = [0, 0, 0, 0, 0, 0, 0];
	var averageVotes   = [0, 0, 0, 0, 0, 0, 0];
	for(var i = 0; i < averageRatings.length; i++){
		averageRatings[i] = totalRatings[i] / amountOfPlaces[i];
		averageVotes[i] = amountOfVotes[i] / amountOfPlaces[i];
	}

	// calculate the relative value for each place in relation to the according maximum-value
	for(var i = 0; i < places.length; i++){
		var cat = places[i].predefinedCategory;
		var checkinScore = places[i].checkinsCount / maxCheckins[cat];
		var likesScore = places[i].likes / maxLikes[cat];
		var ratingScore = ((places[i].amountOfVotes*places[i].rating) + (averageVotes[cat]*averageRatings[cat])) / (places[i].amountOfVotes+averageVotes[cat]);
		ratingScore /= 10;
		if(isNaN(checkinScore)){
			checkinScore = 0;
		}
		if(isNaN(likesScore)){
			likesScore = 0;
		}
		if(isNaN(ratingScore)){
			ratingScore = 0;
		}
		places[i].checkinScore = checkinScore; // for debugging purposes
		places[i].likesScore = likesScore; // for debugging purposes
		places[i].ratingScore = ratingScore; // for debugging purposes
		places[i].totalScore = (checkinScore + likesScore + ratingScore) / 3.0;
	}
}

/*
	based on the algorithm by Haris Iltifat
*/
baseline.scaleByPreferences = function(places){
	for(var i = 0; i < places.length; i++){
		var userPreference = 0;
		if(places[i].predefinedCategory == 6){
			places[i].scaledScore = 0;
		}
		else{
			userPreference = $("input[name="+predefinedCategoryStrings[places[i].predefinedCategory]+"]:checked").val();
			if($("#constraintBased").is(":checked")){ // contraint based algorithm
				switch(userPreference){
					case  "5": places[i].scaledScore = places[i].totalScore * 4;
					break;
					case  "4": places[i].scaledScore = places[i].totalScore * 3.25;
					break;
					case  "3": places[i].scaledScore = places[i].totalScore * 2.50;
					break;
					case  "2": places[i].scaledScore = places[i].totalScore * 1.75;
					break;
					case  "1": places[i].scaledScore = places[i].totalScore * 1.01;
					break;
					default: places[i].scaledScore = 0;
				}
			}
			else{
				places[i].scaledScore = places[i].totalScore * userPreference;
			}
		}
	}
}