var ownImpl = ownImpl || {}; // declaring a namespace.
var categoriesJSON;
$.getJSON("../categories.json", function(data){
	categoriesJSON = data;
});

ownImpl.filterByOpenPlaces = function(places){
	for(var i = 0; i < places.length; i++){
		if(places[i].isOpen != true && places[i].isOpen != "true"){ // "!places[i].isOpen" wouldn't work because the attribute can also be 'unknown'.
			places.splice(i, 1);
			i--;
		}
	}
}

ownImpl.categorize = function(places){
	var deprecatedNameStrings = ["Starbucks"];
	var deprecatedCategoryStrings = ["Fast Food Restaurant", "Multiplex", "Supermarket", "Bakery", "Drugstore", 
	"Pharmacy", "Movie Theater", "Phone Shop", "Furniture", "Grocery"];
	var additionalMuseumStrings = ["Museum", "Planetarium"];
	for(var i = 0; i < places.length; i++){
		if(containsAny(places[i].categoryName, deprecatedCategoryStrings)
			|| containsAny(places[i].name, deprecatedNameStrings)){
			// these places will be permanently deleted.
			places.splice(i, 1);
			i--;
		}
		else if(containsAny(places[i].categoryName, additionalMuseumStrings)){
			// some foursquare-categories that are in the "Arts & Entertainment"-Section actually
			// belong to our museum-Category instead of the Music-Category. That's why we filter
			// them here.
			places[i].predefinedCategory = 0;
		}
		else if(places[i].categoryID == null){
			places[i].predefinedCategory = 6; // other
		}
		else{
			if(typeof categoriesJSON[places[i].categoryID] === "undefined"){
				// if this happens, the Foursquare category tree has been updated and our script to create
				// the category index has to be re-run.
				places[i].predefinedCategory = 6;
				console.log(places[i].name+" "+places[i].categoryName+" "+places[i].categoryID);
			}
			else{
				// https://developer.foursquare.com/categorytree
				switch(categoriesJSON[places[i].categoryID].parentCatID){
					case "4d4b7105d754a06375d81259": // Professional & Other Places
						places[i].predefinedCategory = 0;
						break;
					case "4d4b7105d754a06376d81259": // Nightlife Spot
						places[i].predefinedCategory = 1;
						break;
					case "4d4b7105d754a06374d81259": // Food
						places[i].predefinedCategory = 2;
						break;
					case "4d4b7105d754a06377d81259": // Outdoors & recreation (nature)
						places[i].predefinedCategory = 3;
						break;
					case "4d4b7104d754a06370d81259": // Arts & Entertainment (music)
					case "4d4b7105d754a06373d81259": // Event
						places[i].predefinedCategory = 4;
						break;
					case "4d4b7105d754a06378d81259": // Shop & Service (shopping)
						places[i].predefinedCategory = 5;
						break;
					default: // College & Education, Residence, Travel & Transport (other)
						places[i].predefinedCategory = 6;
				}
			}
		}
	}
}

ownImpl.removeBadRatings = function(places){
	/*
		remove all places with foursquare-rating 0 (since they won't be coming up in the results anyway)
		and remove places with bad rating in categories that have many places.
	*/
	var counts = [[], [], [], [], [], [], []];
	for(var i = 0; i < places.length; i++){
		if(places[i].rating == 0){
			places.splice(i, 1);
			i--;
		}
		else{
			insertSorted(counts[places[i].predefinedCategory], {
				index: i,
				rating: places[i].rating
			}, function(a, b){
				return a.rating - b.rating;
			});
		}
	}
	var indicesToRemove = [];
	for(var i = 0; i < counts.length; i++){
		if(counts[i].length > 10){
			var amountOfPlacesToDelete = 0.25;
			if(i < 6){ // not the other category
				/*
					userPreference    amountOfPlacesToDelete
					1                 35%
					2                 30%
					3                 25%
					4                 20%
					5                 15%
				*/
				amountOfPlacesToDelete = 0.40 - 0.05 * $("input[name="+predefinedCategoryStrings[i]+"]:checked").val();
			}
			for(var j = 0; j < Math.floor(amountOfPlacesToDelete*counts[i].length); j++){ // remove some of the worst-rated places
				// we can't remove them here because that would mess up the other indices.
				insertSorted(indicesToRemove, counts[i][j].index, function(a, b){
					return b - a; // sort reversed.
				});
			}
		}
	}
	for(var i = 0; i < indicesToRemove.length; i++){ // go through the indices from highest to lowest (the array is sorted in descending order)
		places.splice(indicesToRemove[i], 1);
	}
}

ownImpl.scaleByVotes = function(places){
	for(var i = 0; i < places.length; i++){
		/*
			idea behind this:
			if place A has half the score of place B, then A needs the square amount of votes that 
			B has in order to get a similar rating.
			Example:
			A: Rating 10, 10 Votes
			B: Rating 5, 100 Votes
			The ratings are similar, but A still has a slight advantage, due to the '+1' in the formula. This is needed 
			because log(1) = 0 which would yield to a total score of 0.
			If B had 120 Votes, the ratings would be equal.
		*/
		places[i].totalScore = places[i].rating * Math.log(places[i].amountOfVotes+1)/Math.log(2);
	}
}

ownImpl.scaleByPreferences = function(places){
	for(var i = 0; i < places.length; i++){
		userPreference = $("input[name="+predefinedCategoryStrings[places[i].predefinedCategory]+"]:checked").val();
		if(userPreference == 0){
			places[i].scaledScore = 0;
		}
		else{
			places[i].scaledScore = places[i].totalScore;
		}
	}
}