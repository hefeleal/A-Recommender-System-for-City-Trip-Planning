/* constants: */
// algorithm IDs:
var constraintFreeID = 0;
var constraintBasedID = 1;
var showAllPlacesID = 2;

// implementation IDs:
var baselineID = 0;
var ownImplID = 1;

var predefinedCategoryStrings = ['museum', 'nightlife', 'food', 'nature', 'music', 'shopping', 'other', 'source', 'destination'];
var printablePredefinedCategoryStrings = ['Sights&nbsp;&&nbsp;Museums', 'Night&nbsp;&nbsp;Life', 'Food', 'Outdoors&nbsp;&&nbsp;Recreation', 'Music&nbsp;&&nbsp;Events', 'Shopping', 'Other', 'Starting point', 'End point'];


// if comparisonFunction(a,b) evaluates to 0, then values are identical, if negative then a < b, otherwise a > b

function insertSorted(sortedArr, value, comparisonFunction){
    var position = sortedArr.length;
    for(var i = 0; i < sortedArr.length; i++){
        if(comparisonFunction(sortedArr[i], value) >= 0){ // found bigger element
            position = i; // insert in front of bigger element
            break;
        }
    }
    sortedArr.splice(position, 0, value);
}

function removeSorted(sortedArr, value){
    for(var i = 0; i < sortedArr.length; i++){
        if(sortedArr[i] == value){
    		sortedArr.splice(i, 1);
            break;
        }
    }
}

// returns the index where the element is, or -1 if the array doesn't contain the value
function contains(sortedArr, value, comparisonFunction){
	for(var i = 0; i < sortedArr.length; i++){
		if(comparisonFunction(sortedArr[i], value) == 0){
			return i;
		}
	}
	return -1;
}

function getNextValue(sortedArr, value, comparisonFunction){
	for(var i = 0; i < sortedArr.length; i++){
		if(comparisonFunction(sortedArr[i], value) == 0){
			if(i+1 < sortedArr.length){
				return sortedArr[i+1];
			}
			break;
		}
		else if(comparisonFunction(sortedArr[i], value) > 0){
			return sortedArr[i];
		}
	}
	return null;
}

function getPreviousValue(sortedArr, value, comparisonFunction){
	for(var i = 0; i < sortedArr.length; i++){
		if(comparisonFunction(sortedArr[i], value) >= 0){
			if(i > 0){
				return sortedArr[i-1];
			}
			break;
		}
	}
	return null;
}


/*
	adopted from Haris Iltifat
*/
function distance(latSource, lngSource, latDestination, lngDestination, unit){
	theta = lngSource - lngDestination;
	dist = Math.sin(deg2rad(latSource)) * Math.sin(deg2rad(latDestination)) + Math.cos(deg2rad(latSource)) * Math.cos(deg2rad(latDestination)) * Math.cos(deg2rad(theta));
	dist = rad2deg(Math.acos(dist)) * 60 * 1.1515;
	if(unit == 'K'){
		dist = dist * 1.609344;
	} else if (unit == 'N'){
		dist = dist * 0.8684;
	}
	return dist;
}

function rad2deg(angle){
	return angle * (180 / Math.PI);
}

function deg2rad(angle){
	return angle * (Math.PI / 180);
}

/*
	returns true if any element of the array is a substring of str.
	In other words: returns true if str contains any of the elements of arr.
*/
function containsAny(str, arr){
	if(str == null){
		return false;
	}
	return arr.map(function(elem){
		return str.toLowerCase().indexOf(elem.toLowerCase());
	}).some(function(elem){
		return elem > -1;
	});
}

function showModal(message){
	$("#universalModal p").html(message);
	$("#universalModal").modal('show');
}

/*
	xs and ys must be of the same size.
	only to be used for values between 0 and 5. Otherwise, the maximum variance has to be adjusted like so:
	var minimum = 0;
	var maximum = 5;
	var minMaxMean = (minimum + maximum) / 2;
	var maxVariance = ( (minimum-minMaxMean)*(minimum-minMaxMean) + (maximum-minMaxMean)*(maximum-minMaxMean) )/2;
*/
function pearsonCoefficient(xs, ys){
	var n = xs.length;
	var xMean = 0;
	var yMean = 0;
	for(var i = 0; i < n; i++){
		xMean += xs[i];
		yMean += ys[i];
	}
	xMean /= n;
	yMean /= n;

	if(xMean == 0 || yMean == 0){
		return 0; // special case for when there are no values to compare yet.
	}

	// special case for when all the user ratings are the same.
	var allxsTheSame = true;
	var allysTheSame = true;
	for(var i = 1; i < n; i++){
		if(xs[i] != xMean){
			allxsTheSame = false;
		}
		if(ys[i] != yMean){
			allysTheSame = false;
		}
	}

	if(allxsTheSame && allysTheSame){
		return 1;
	}
	else if(allxsTheSame){
		var sampleVariance = 0;
		for(var i = 0; i < n; i++){
			sampleVariance += (ys[i] - yMean)*(ys[i] - yMean);
		}
		sampleVariance /= n;
		// 6.25 is the maximum variance that can be achieved with values between 0 and 5.
		return 1-(sampleVariance / 6.25);
	}
	else if(allysTheSame){
		var sampleVariance = 0;
		for(var i = 0; i < n; i++){
			sampleVariance += (xs[i] - yMean)*(xs[i] - yMean);
		}
		sampleVariance /= n;
		return 1-(sampleVariance / 6.25);
	}
	else{
		var numerator = 0;
		var denominatorPart1 = 0;
		var denominatorPart2 = 0;
		for(var i = 0; i < n; i++){
			var xTmp = xs[i] - xMean;
			var yTmp = ys[i] - yMean;
			numerator += xTmp * yTmp;
			denominatorPart1 += xTmp * xTmp;
			denominatorPart2 += yTmp * yTmp;
		}
		var denominator = Math.sqrt(denominatorPart1 * denominatorPart2);
		return numerator / denominator;
	}
}