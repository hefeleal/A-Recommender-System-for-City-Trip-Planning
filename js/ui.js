var updatingUI = false;
var clickedOnSecondTab = false; // whether the user has already clicked on the second tab in the feedback-form. If not, we show an error on submission
var preferencesChangedCounter = 0; // how often the preferences have been changed. We need this in order not to update the map too often if the user changes a bunch of preferences in a short time.
// save how often these functions are called in this session:
var validUpdateUICalls = 0;
var validSendFeedbackCalls = 0;
var currentPosition = null;

function toggleConstraintBasedUI(){
	if($("#time").is(":disabled")){
		$('#time').prop("disabled", false);
		$('#budget').prop("disabled", false);
		$('#time').focus();
	}
	else{
		$('#time').prop("disabled", true);
		$('#budget').prop("disabled", true);
		$('#time').val("");
		$('#budget').val("");
		if(destination_marker.position != null && source_marker.position != null){
			updateUI();
		}
	}
}

var clientID = "RFTYUT32FXWDE4KIQVAROIGSMP4BFDQPPOD4GVAMQE31KU0Q";
var feedbackObject = {};

function updateUI(){
	if(!updatingUI){
		updatingUI = true;
        deleteAllPlaceMarkers();
        deletePath();
        $('#source_textfield').val(source_marker.getTitle().slice(0, -" (drag to adjust position)".length));
		var everythingFilledOut = true;
		if($("#constraintBased").is(":checked")){
			var b = $("#budget").val();
			var t = $("#time").val();
			if(b == ''){
				$("#budget").parent().addClass("has-error");
				$("#budget").focus();
				everythingFilledOut = false;
			}
			else if(isNaN(parseFloat(b)) || !isFinite(b)){
				$("#budget").parent().addClass("has-error");
				$("#budget").focus();
				everythingFilledOut = false;
			}
			else if(b > 1000){
				showModal("In order to give meaningful and realistic results, the budget limit must not be higher than 1000€.<br><br>Please adjust the budget limit or disable these constraints altogether.");
				everythingFilledOut = false;
			}
			else{
				$("#budget").parent().removeClass("has-error");
			}
			if(t == ''){
				$("#time").parent().addClass("has-error");
				$("#time").focus();
				everythingFilledOut = false;
			}
			else if(isNaN(parseFloat(t)) || !isFinite(t)){
				$("#time").parent().addClass("has-error");
				$("#time").focus();
				everythingFilledOut = false;
			}
			else if(t > 500){
				showModal("In order to give meaningful and realistic results, the time limit must not be higher than 500 minutes.<br><br>Please adjust the time limit or disable these constraints altogether.");
				everythingFilledOut = false;
			}
			else{
				$("#time").parent().removeClass("has-error");
			}
		}
		
		if(feedbackObject.sString != $("#source_textfield").val()
			|| feedbackObject.dString != $("#destination_textfield").val()){
			$('#toggleRouteBlue').bootstrapToggle('on');
			$('#toggleRouteRed').bootstrapToggle('on');
			if(Math.random() < 0.5){
				routesColor.reverse();
			}
		}
		if(source_marker.position == null){
			$("#source_textfield").parent().addClass("has-error");
			everythingFilledOut = false;
		}
		else{
			$("#source_textfield").parent().removeClass("has-error");
			/*
				see below for explanation.
			*/
			feedbackObject.sLat = source_marker.position.lat();
			feedbackObject.sLng = source_marker.position.lng();
			feedbackObject.sString = $("#source_textfield").val();

			if(destination_marker.position == null){
				$("#destination_textfield").parent().addClass("has-error");
				everythingFilledOut = false;
			}
			else{
				$("#destination_textfield").parent().removeClass("has-error");
				/*
					we need to set this here for a very specific bug: when both positions are set and you type in a
					new destination which is more than 5km apart from the source, you get an error, like expected. 
					Then, when you type in a new source, which is within 5km of the new destination and you press
					enter and enter again in the destination-textfield, no update will occur since the dString from
					the feedbackObject and the string in the textfield don't match. Updating the dString here fixes this.
				*/
				feedbackObject.dLat = destination_marker.position.lat();
				feedbackObject.dLng = destination_marker.position.lng();
				feedbackObject.dString = $("#destination_textfield").val();

				var sourceDestDistance = distance(source_marker.position.lat(), source_marker.position.lng(), destination_marker.position.lat(),
				destination_marker.position.lng(), 'K');
				if(sourceDestDistance > 5){
					everythingFilledOut = false;
					showModal("Starting point and end point are too far apart from each other (their distance is "+sourceDestDistance.toFixed(1)+"km).<br><br>In order to give meaningful and realistic results, the maximum distance is 5km.");
				}
			}
		}
		if(everythingFilledOut){
            $('#source_textfield').blur();
            $('#destination_textfield').blur();
			$("#pageOverlay").css('display', 'block');
			$.ajax({
				url: "foursquareQuery.php", 
				data: {
					sLat: source_marker.position.lat(), 
					sLng: source_marker.position.lng(), 
					dLat: destination_marker.position.lat(),
					dLng: destination_marker.position.lng()
				}, 
				timeout: 15000,
				error: function(jqXHR, textStatus, errorThrown){
					$("#pageOverlay").css('display', 'none');
			    	updatingUI = false;
					showModal("Could not connect to server. Please check your internet connection and try again.");
				},
				success: function(data){
					validUpdateUICalls++;
					var parsedJSONBaseline = jQuery.parseJSON(data).filter(function(val){
						return val.isInBaselineApproach;
					}); // the baseline approach only takes the first 100 places into account.
					// we cant just cut off the first 100 places because my own impl also adds more sights which would then
					// be in the baseline-data if there are fewer than 100 places overall.
					var parsedJSONOwnImpl = jQuery.parseJSON(data); // my own implementation takes up to 200 places into account.
					var amountOfPlacesBaseline = parsedJSONBaseline.length;
					var amountOfPlacesOwnImpl = parsedJSONOwnImpl.length;
					if(parsedJSONBaseline.length > 0){
						// classification:
						baseline.categorize(parsedJSONBaseline);
						baseline.scoreByMaxValues(parsedJSONBaseline);
						baseline.scaleByPreferences(parsedJSONBaseline);
						ownImpl.categorize(parsedJSONOwnImpl);
						ownImpl.removeBadRatings(parsedJSONOwnImpl);
						ownImpl.scaleByVotes(parsedJSONOwnImpl);
						ownImpl.scaleByPreferences(parsedJSONOwnImpl);

						$("#feedbackOptionsContainer").css('display', 'block'); // this has to be done a bit before setting the margin-top-property. Otherwise it isn't rendered correctly
						
						// algorithms:
						var pathsEmpty = false;
						var pathBaseline;
						var pathOwnImpl;
						if($("#constraintBased").is(":checked")){
							pathBaseline = baseline.constraintBasedAlgorithm(parsedJSONBaseline, source_marker, destination_marker, $("#time").val(), $("#budget").val());
							pathOwnImpl = ownImpl.constraintBasedAlgorithm(parsedJSONOwnImpl, source_marker, destination_marker, $("#time").val(), $("#budget").val());
							pathsEmpty = pathBaseline.length == 0 || pathOwnImpl.length == 0;
							if(!pathsEmpty){
								if(routesColor.indexOf("#25ACF6") == baselineID){
									addPaths(pathBaseline, baselineID, pathOwnImpl, ownImplID);
									addPlaceTables(pathBaseline, pathOwnImpl, constraintBasedID);
								}
								else{
									addPaths(pathOwnImpl, ownImplID, pathBaseline, baselineID);
									addPlaceTables(pathOwnImpl, pathBaseline, constraintBasedID);
								}
							}
							else{
								$("#feedbackOptionsContainer").css('display', 'none');
								showModal("Unfortunatelly, it is impossible to find a path using these constraints.<br><br>\
									Please adjust your time and/or budget constraints or disable them using the switch above.");
							}
						}
						else{
							pathBaseline = baseline.constraintFreeAlgorithm(parsedJSONBaseline, source_marker, destination_marker);
							pathOwnImpl = ownImpl.constraintFreeAlgorithm(parsedJSONOwnImpl, source_marker, destination_marker);
							pathsEmpty = pathBaseline.length == 0 || pathOwnImpl.length == 0;
							if(!pathsEmpty){
								if(routesColor.indexOf("#25ACF6") == baselineID){
									addPaths(pathBaseline, baselineID, pathOwnImpl, ownImplID);
									addPlaceTables(pathBaseline, pathOwnImpl, constraintFreeID);
								}
								else{
									addPaths(pathOwnImpl, ownImplID, pathBaseline, baselineID);
									addPlaceTables(pathOwnImpl, pathBaseline, constraintFreeID);
								}
							}
							else{
								$("#feedbackOptionsContainer").css('display', 'none');
					    		showModal("Unfortunatelly, no locations were found on this route. This could be because \
					    			your start and end points are too close together or because there is no data of \
					    			interesting locations available in this area.<br><br>Please adjust your starting \
					    			and/or end point to receive some actual results. It may help to enter points in a \
					    			larger city or in an area where there are more shops and restaurants on the way \
					    			between starting and end point.");
			    			}
						}
						if(!pathsEmpty){
							// -2 for source and destination
							updateFeedbackObject(pathBaseline.length-2, pathOwnImpl.length-2, amountOfPlacesBaseline, amountOfPlacesOwnImpl);
							
							if(routesColor.indexOf("#25ACF6") == baselineID){
								updateSidebarIcons(pathBaseline, pathOwnImpl);
							}
							else{
								updateSidebarIcons(pathOwnImpl, pathBaseline);
							}
							$("#visibilityRow").css('visibility', 'visible');
						}
			    	}
			    	else{
			    		showModal("Unfortunatelly, no locations were found on this route. This could be because \
			    			your start and end points are too close together or because there is no data of \
			    			interesting locations available in this area.<br><br>Please adjust your starting \
			    			and/or end point to receive some actual results. It may help to enter points in a \
			    			larger city or in an area where there are more shops and restaurants on the way \
			    			between starting and end point.");

			    	}
					$("#pageOverlay").css('display', 'none');
			    	updatingUI = false;
			    }
			});
		}
		else{
			resetUI();
			updatingUI = false;
		}
	}
}

function resetUI(){
    resetSidebarIcons();
    removePlaceTables();
    hideFeedbackOptions();
    $("#walkingTimeLabelBlue").css('display', 'none');
    $("#walkingTimeLabelRed").css('display', 'none');
}

function resetSidebarIcons(){
	$("#museumSidebarIcon").attr('title', printablePredefinedCategoryStrings[0]).tooltip('fixTitle');
	$("#nightlifeSidebarIcon").attr('title', printablePredefinedCategoryStrings[1]).tooltip('fixTitle');
	$("#foodSidebarIcon").attr('title', printablePredefinedCategoryStrings[2]).tooltip('fixTitle');
	$("#natureSidebarIcon").attr('title', printablePredefinedCategoryStrings[3]).tooltip('fixTitle');
	$("#musicSidebarIcon").attr('title', printablePredefinedCategoryStrings[4]).tooltip('fixTitle');
	$("#shoppingSidebarIcon").attr('title', printablePredefinedCategoryStrings[5]).tooltip('fixTitle');
}

function updateSidebarIcons(pathBlue, pathRed){
	var catsBlue = [0, 0, 0, 0, 0, 0, 0];
	for(var i = 1; i < pathBlue.length-1; i++){ // omit source and destination
		catsBlue[pathBlue[i].predefinedCategory]++;
	}
	var catsRed = [0, 0, 0, 0, 0, 0, 0];
	for(var i = 1; i < pathRed.length-1; i++){ // omit source and destination
		catsRed[pathRed[i].predefinedCategory]++;
	}
	for(var i = 0; i < 7; i++){
		if(catsBlue[i] == 1){
			catsBlue[i] = catsBlue[i]+'&nbsp;venue';
		}
		else{
			catsBlue[i] = catsBlue[i]+'&nbsp;venues';
		}
		if(catsRed[i] == 1){
			catsRed[i] = catsRed[i]+'&nbsp;venue';
		}
		else{
			catsRed[i] = catsRed[i]+'&nbsp;venues';
		}
	}

	$("#museumSidebarIcon").attr('title', printablePredefinedCategoryStrings[0]+'<br>blue:&nbsp;'+catsBlue[0]+'<br>red:&nbsp;'+catsRed[0]).tooltip('fixTitle');
	$("#nightlifeSidebarIcon").attr('title', printablePredefinedCategoryStrings[1]+'<br>blue:&nbsp;'+catsBlue[1]+'<br>red:&nbsp;'+catsRed[1]).tooltip('fixTitle');
	$("#foodSidebarIcon").attr('title', printablePredefinedCategoryStrings[2]+'<br>blue:&nbsp;'+catsBlue[2]+'<br>red:&nbsp;'+catsRed[2]).tooltip('fixTitle');
	$("#natureSidebarIcon").attr('title', printablePredefinedCategoryStrings[3]+'<br>blue:&nbsp;'+catsBlue[3]+'<br>red:&nbsp;'+catsRed[3]).tooltip('fixTitle');
	$("#musicSidebarIcon").attr('title', printablePredefinedCategoryStrings[4]+'<br>blue:&nbsp;'+catsBlue[4]+'<br>red:&nbsp;'+catsRed[4]).tooltip('fixTitle');
	$("#shoppingSidebarIcon").attr('title', printablePredefinedCategoryStrings[5]+'<br>blue:&nbsp;'+catsBlue[5]+'<br>red:&nbsp;'+catsRed[5]).tooltip('fixTitle');
}

/*
	in case the user changes his settings and then sends his 
	feedback, we need to know exactly with which settings the
	route was computed. Therefore, we save them immediatelly
	after the route is calculated.
*/
function updateFeedbackObject(amountOfPlacesBaseline, amountOfPlacesOwnImpl, totalAmountOfPlacesBaseline, totalAmountOfPlacesOwnImpl){
	var alg;
	if($("#constraintBased").is(":checked")){
		alg = constraintBasedID;
	}
	else{
		alg = constraintFreeID;
	}
	feedbackObject = {
		sLat: source_marker.position.lat(),
		sLng: source_marker.position.lng(),
		sString: $("#source_textfield").val(),
		dLat: destination_marker.position.lat(),
		dLng: destination_marker.position.lng(),
		dString: $("#destination_textfield").val(),
		artPref: $("input[name=museum]:checked").val(),
		nightlifePref: $("input[name=nightlife]:checked").val(),
		foodPref: $("input[name=food]:checked").val(),
		naturePref: $("input[name=nature]:checked").val(),
		musicPref: $("input[name=music]:checked").val(),
		shoppingPref: $("input[name=shopping]:checked").val(),
		algorithm: alg,
		timeConstraint: alg == constraintBasedID ? $("#time").val() : null,
		budgetConstraint: alg == constraintBasedID ? $("#budget").val() : null,
		amountOfPlaces0: amountOfPlacesBaseline,
		amountOfPlaces1: amountOfPlacesOwnImpl,
		totalAmountOfPlaces0: totalAmountOfPlacesBaseline,
		totalAmountOfPlaces1: totalAmountOfPlacesOwnImpl,
		idOfBlueRoute: routesColor.indexOf("#25ACF6")
	};
	$("[id^='slider']").slider('setValue', 3);
	$("#sliderBlue4, #sliderRed4").slider('setValue', 2);
    $("a[href='#one']").tab('show');
	$("#feedbackPanel").css("display", "block");
}

function getCategoryColor(catID){
	switch(catID){
		case 0: return '#FF9637';
		case 1: return '#8E67FD';
		case 2: return '#FDF569';
		case 3: return '#00E64D';
		case 4: return '#E661AC';
		case 5: return '#67DDDD';
		case 6: return '#6991FD';
	}
	return '#000';
}

// places must not be empty!
function addPlaceTables(placesBlue, placesRed, algorithmID){
	$("#feedbackOptionsContainer").css('margin-top', '0px');
	$("#feedbackOptionsContainer").css('opacity', 1);
	$("#feedbackLikeBetterNoRouteButton").button('toggle');
	$("#feedbackTextarea").val("");
	$("#feedbackBanner").css('visibility', 'visible');
	$("#feedbackBanner").css('opacity', 1);
	clickedOnSecondTab = false;
	var inner1;
	var inner2;
	if(algorithmID == constraintFreeID){
		inner1 = "<thead><tr><th></th><th>Name</th><th>Subcategory</th></tr></thead><tbody>";
		inner1 += "<tr><td style='padding-right: 15px;'></td><td>"+placesBlue[0].name+"</td><td>"+placesBlue[0].categoryName+"</td></tr>";
		for(var i = 1; i < placesBlue.length-1; i++){
			inner1 += "<tr>\
			<td title='"+printablePredefinedCategoryStrings[placesBlue[i].predefinedCategory]+"' style='padding-right: 15px; background-color:"+getCategoryColor(placesBlue[i].predefinedCategory)+";'></td>\
			<td><a href='http://foursquare.com/v/"+placesBlue[i].id+"?ref="+clientID+"' target='_blank'>"+placesBlue[i].name+"</a></td>\
			<td>"+placesBlue[i].categoryName+"</td>\
			</tr>";
		}
		inner1 += "<tr><td style='padding-right: 15px;'></td><td>"+placesBlue[placesBlue.length-1].name+"</td><td>"+placesBlue[placesBlue.length-1].categoryName+"</td></tr>";
		inner1 += "</tbody>";

		inner2 = "<thead><tr><th></th><th>Name</th><th>Subcategory</th></tr></thead><tbody>";
		inner2 += "<tr><td style='padding-right: 15px;'></td><td>"+placesRed[0].name+"</td><td>"+placesRed[0].categoryName+"</td></tr>";
		for(var i = 1; i < placesRed.length-1; i++){
			inner2 += "<tr>\
			<td title='"+printablePredefinedCategoryStrings[placesRed[i].predefinedCategory]+"' style='padding-right: 15px; background-color:"+getCategoryColor(placesRed[i].predefinedCategory)+";'></td>\
			<td><a href='http://foursquare.com/v/"+placesRed[i].id+"?ref="+clientID+"' target='_blank'>"+placesRed[i].name+"</a></td>\
			<td>"+placesRed[i].categoryName+"</td>\
			</tr>";
		}
		inner2 += "<tr><td style='padding-right: 15px;'></td><td>"+placesRed[placesRed.length-1].name+"</td><td>"+placesRed[placesRed.length-1].categoryName+"</td></tr>";
		inner2 += "</tbody>";
	}
	else if(algorithmID == constraintBasedID){
		inner1 = "<thead><tr><th></th><th>Name</th><th>Subcategory</th><th>estimated<br>time (mins)</th><th>estimated<br>cost (in €)</th></tr></thead><tbody>";
		inner1 += "<tr><td></td><td>"+placesBlue[0].name+"</td><td>"+placesBlue[0].categoryName+"</td><td></td><td></td></tr>";
		for(var i = 1; i < placesBlue.length-1; i++){
			inner1 += "<tr>\
			<td title='"+printablePredefinedCategoryStrings[placesBlue[i].predefinedCategory]+"' style='background-color:"+getCategoryColor(placesBlue[i].predefinedCategory)+";'></td>\
			<td><a href='http://foursquare.com/v/"+placesBlue[i].id+"?ref="+clientID+"' target='_blank'>"+placesBlue[i].name+"</a></td>\
			<td>"+placesBlue[i].categoryName+"</td>\
			<td>"+placesBlue[i].timeToSpend+"</td>\
			<td>"+placesBlue[i].costOfPlace+"</td>\
			</tr>";
		}
		inner1 += "<tr><td></td><td>"+placesBlue[placesBlue.length-1].name+"</td><td>"+placesBlue[placesBlue.length-1].categoryName+"</td><td></td><td></td></tr>";
		inner1 += "</tbody>";

		inner2 = "<thead><tr><th></th><th>Name</th><th>Subcategory</th><th>estimated<br>time (mins)</th><th>estimated<br>cost (in €)</th></tr></thead><tbody>";
		inner2 += "<tr><td></td><td>"+placesRed[0].name+"</td><td>"+placesRed[0].categoryName+"</td><td></td><td></td></tr>";
		for(var i = 1; i < placesRed.length-1; i++){
			inner2 += "<tr>\
			<td title='"+printablePredefinedCategoryStrings[placesRed[i].predefinedCategory]+"' style='background-color:"+getCategoryColor(placesRed[i].predefinedCategory)+";'></td>\
			<td><a href='http://foursquare.com/v/"+placesRed[i].id+"?ref="+clientID+"' target='_blank'>"+placesRed[i].name+"</a></td>\
			<td>"+placesRed[i].categoryName+"</td>\
			<td>"+placesRed[i].timeToSpend+"</td>\
			<td>"+placesRed[i].costOfPlace+"</td>\
			</tr>";
		}
		inner2 += "<tr><td></td><td>"+placesRed[placesRed.length-1].name+"</td><td>"+placesRed[placesRed.length-1].categoryName+"</td><td></td><td></td></tr>";
		inner2 += "</tbody>";
	}
	$("#placeTableBlue").html(inner1);
	$("#placeTableBlue").css('display', 'table');
	$("#placeTableRed").html(inner2);
	$("#placeTableRed").css('display', 'table');
	if(placesRed.length <= 5 || placesBlue.length <= 5){
		$("#placeTableFootnote").html("Note: to receive more places, try adjusting start point, end point, or time- and budget-constraints.");
	}
	else{
		$("#placeTableFootnote").html("");
	}
	$("#placeTablesPanel").css('display', 'block');
}

function removePlaceTables(){
	$("#placeTableBlue").html('');
	$("#placeTableBlue").css('display', 'none');
	$("#placeTableRed").html('');
	$("#placeTableRed").css('display', 'none');
	$("#placeTablesPanel").css('display', 'none');
}

/*
	showing the options again is as simple as 
	$("#feedbackOptionsContainer").css('margin-top', '0px');
	$("#feedbackOptionsContainer").css('opacity', 1);
*/
function hideFeedbackOptions(){
	var divHeight = $("#feedbackOptionsContainer").outerHeight(true);
	$("#feedbackOptionsContainer").css('margin-top', '-'+divHeight+'px');
	$("#feedbackOptionsContainer").css('opacity', 0);
	$("#feedbackBanner").css('opacity', 0);

	setTimeout(function(){ // when the margin-top/opacity-transitions are over
		$("#feedbackOptionsContainer").removeClass('feedbackSent');
		$("#feedbackOptionsBackface").css('display', 'none');
	},700);
	setTimeout(function(){ // when all transitions are over (including flipping the div back to normal which happens through the removal of the feedbackSent-class.)
		$("#feedbackOptionsContainer").css('display', 'none');
		$("#feedbackBanner").css('visibility', 'hidden');
	},1300);
}

function sendFeedback(){
	if(clickedOnSecondTab){
		validSendFeedbackCalls++;
		feedbackObject.walkingDistance0 = actualDistance[0];
		feedbackObject.walkingDistance1 = actualDistance[1];
		feedbackObject.directDistance = (distance(source_marker.position.lat(), source_marker.position.lng(), 
		destination_marker.position.lat(), destination_marker.position.lng(), 'K')*1000).toFixed(0);
		
		feedbackObject.rLikeBetter = $("input[name=feedbackLikeBetter]:checked").val();
		var sliderStrings;
		if(routesColor.indexOf("#25ACF6") == baselineID){
			sliderStrings = ['Blue', 'Red'];
		}
		else{
			sliderStrings = ['Red', 'Blue'];
			if(feedbackObject.rLikeBetter != 2){
				feedbackObject.rLikeBetter = feedbackObject.rLikeBetter==0?1:0; // 0 -> 1, 1 -> 0, 2 -> 2
			}
		}
		feedbackObject.rAmountOfPlaces0 = $('#slider'+sliderStrings[0]+'1').val();
		feedbackObject.rPathLength0 = $('#slider'+sliderStrings[0]+'2').val();
		feedbackObject.rMatchPrefs0 = $('#slider'+sliderStrings[0]+'3').val();
		feedbackObject.rTakeRouteYourself0 = $('#slider'+sliderStrings[0]+'4').val();
		feedbackObject.rOverall0 = $('#slider'+sliderStrings[0]+'5').val();
		feedbackObject.rAmountOfPlaces1 = $('#slider'+sliderStrings[1]+'1').val();
		feedbackObject.rPathLength1 = $('#slider'+sliderStrings[1]+'2').val();
		feedbackObject.rMatchPrefs1 = $('#slider'+sliderStrings[1]+'3').val();
		feedbackObject.rTakeRouteYourself1 = $('#slider'+sliderStrings[1]+'4').val();
		feedbackObject.rOverall1 = $('#slider'+sliderStrings[1]+'5').val();

		feedbackObject.comment = $('#feedbackTextarea').val();
		feedbackObject.validUpdateUICalls = validUpdateUICalls;
		feedbackObject.validSendFeedbackCalls = validSendFeedbackCalls;
		feedbackObject.usingCurrentPosition = (currentPosition == feedbackObject.sString);
		$.get("feedback.php", feedbackObject, function(data){
			if(data == "ok"){
				$("#feedbackOptionsBackface").css('display', 'block'); // we have the backface initially hidden for Internet Explorer 9.
				setTimeout(function(){
					$("#feedbackOptionsContainer").addClass('feedbackSent');
				}, 50);
				setTimeout(hideFeedbackOptions, 1000);
			}
			else{
				showModal("Sorry, couldn't submit feedback :(<br><br>If this problem persists, please contact me.");
			}
		});
	}
	else{
		showModal("Please rate the second (red) route as well.<br><br>You can access the questions for that \
			route by clicking on the other tab of this feedback form.");
	}
}

$(document).ready(function(){
	$("#feedbackOptionsBackface").height($("#feedbackOptions").outerHeight());
	$("#feedbackOptionsContainer").height($("#feedbackOptions").outerHeight());
	document.getElementById("feedbackOptionsFlipper").style.transformOrigin = $("#feedbackOptions").outerWidth()/2+"px"+" "+$("#feedbackOptions").outerHeight()/2+"px"; 

	$("#feedbackOptionsContainer").css('display', 'none'); // if we set this property any sooner, the container isn't rendered properly.
	
	$("#time").keypress(function(event){
	    if(event.keyCode == 13){
	        event.preventDefault();
	        updateUI();
	    }
	});
	$("#budget").keypress(function(event){
	    if(event.keyCode == 13){
	        event.preventDefault();
	        updateUI();
	    }
	});
	$('input:radio').on('change', function(){
		if(this.name != "feedbackLikeBetter"){
			if(destination_marker.position != null && source_marker.position != null){
				preferencesChangedCounter++;
				var current = preferencesChangedCounter;
				setTimeout(function(){
					// check if there was another change so that updateUI isn't called too often
					if(current == preferencesChangedCounter){
						updateUI();
					}
				},3000);
			}
		}
	});
	$('#sliderBlue1, #sliderRed1').slider({
		formatter: function(value) {
			switch(value){
				case 1: return 'too low';
				case 2: return 'low';
				case 3: return 'perfect';
				case 4: return 'high';
				case 5: return 'too high';
			}
			return 'invalid';
		}
	});
	$('#sliderBlue2, #sliderRed2').slider({
		formatter: function(value) {
			switch(value){
				case 1: return 'too short';
				case 2: return 'short';
				case 3: return 'perfect';
				case 4: return 'long';
				case 5: return 'too long';
			}
			return 'invalid';
		}
	});
	$('#sliderBlue3, #sliderRed3').slider({
		formatter: function(value) {
			switch(value){
				case 1: return 'not at all';
				case 2: return 'rather not';
				case 3: return 'fairly well';
				case 4: return 'quite well';
				case 5: return 'perfectly';
			}
			return 'invalid';
		}
	});
	$('#sliderBlue4, #sliderRed4').slider({
		formatter: function(value) {
			switch(value){
				case 1: return 'no';
				case 2: return 'maybe';
				case 3: return 'yes';
			}
			return 'invalid';
		}
	});
	$('#sliderBlue5, #sliderRed5').slider({
		formatter: function(value) {
			switch(value){
				case 1: return 'not satisfied';
				case 2: return 'rather not satisfied';
				case 3: return 'rather satisfied';
				case 4: return 'quite satisfied';
				case 5: return 'very satisfied';
			}
			return 'invalid';
		}
	});
	$('#constraintBased').change(toggleConstraintBasedUI);
	$('#toggleRouteBlue').change(function(){
		var routeID = routesColor.indexOf("#25ACF6");
		if($('#toggleRouteBlue').is(':checked')){
			showRoute(routeID);
		}
		else{
			hideRoute(routeID);
		}
	});
	$('#toggleRouteRed').change(function(){
		var routeID = routesColor.indexOf("#FF593E");
		if($('#toggleRouteRed').is(':checked')){
			showRoute(routeID);
		}
		else{
			hideRoute(routeID);
		}
	});
	$('#feedbackButton').click(sendFeedback);
	$('[data-toggle="tooltip"]').tooltip();
	$(document).on('shown.bs.tab', 'a[data-toggle=tab]', function(e){
		// update the position of the tooltips manually due to a bug in the slider-framework.
		// see also: https://github.com/seiyria/bootstrap-slider/issues/52
		var tooltips = $('.tooltip-main');
		for(var i = 0; i < tooltips.length; i++){
			var tooltipWidth = $(tooltips[i]).find(".tooltip-inner").innerWidth();
			$(tooltips[i]).css('margin-left', -tooltipWidth/2);
		}

        if(!clickedOnSecondTab && e.target.hash == "#two"){
        	clickedOnSecondTab = true;
        }
    });
    $("#feedbackBanner a").click(function(){
    	$('html, body').animate({
    		scrollTop: $("#feedbackOptionsContainer").offset().top
    	}, 500);
    });

	hideFeedbackOptions(); // if we call this function any sooner, the container isn't hidden properly.
});