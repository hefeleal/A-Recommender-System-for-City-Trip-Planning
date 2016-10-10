var map;
// Markers:
var source_marker;
var destination_marker;
var currentlyOpenInfoWindow; // temporarily stores the infowindow which is open at the moment (or null if none) so that we can close it if the user wants to open another infowindow.
var place_markers = [[], []];

// Path-Variables:
var directionsService;
var directionsDisplays = [[], []];
var directionDisplayRequests = [[], []];
var currentDirectionDisplayIndex;
var actualWalkingTime;
var actualDistance;
var routesOpacity = [0.8, 0.8];
var routesColor = ["#FF593E", "#25ACF6"];

var iconsForCategories = ['ms/icons/orange-dot.png', 'ms/icons/purple-dot.png', 'ms/icons/yellow-dot.png', 
'ms/icons/green-dot.png', 'ms/icons/pink-dot.png', 'ms/icons/ltblue-dot.png', 'ms/icons/blue-dot.png', 
'arrow.png', 'arrow.png'];

function initialize(){
    // init map:
    var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(48.14, 11.57)
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    directionsService = new google.maps.DirectionsService();
    
    // init textfields:
    var source = new google.maps.places.Autocomplete(document.getElementById('source_textfield'), { types: ['geocode'] });
    var destination  = new google.maps.places.Autocomplete(document.getElementById('destination_textfield'), { types: ['geocode'] });
    
    // add source marker:
    source_marker = new google.maps.Marker({
        position: null,
        map: map,
        animation: google.maps.Animation.DROP,
        draggable: true,
        raiseOnDrag: false,
        title: 'Source',
        infowindow: null,
        icon: 'http://maps.google.com/mapfiles/'+iconsForCategories[7]
    });
    google.maps.event.addListener(source_marker, 'dragend', function(){
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            latLng: source_marker.getPosition()
        }, function(results, status){
            var placeName;
            if(status == google.maps.GeocoderStatus.OK){
                placeName = results[0].formatted_address;
            } 
            else{
                placeName = source_marker.getPosition();
            }
            $('#source_textfield').blur();
            $('#source_textfield').val(placeName);
            source_marker.setTitle(placeName+' (drag to adjust position)');
            source_marker.infowindow.setContent('<h3>Starting Point: '+placeName+'</h3><p>(drag to adjust position)</p>');
            updateUI();
        });
    });


    /* see http://stackoverflow.com/q/27865483 */
    /*
    some important scenarios:
    user makes input to source_textfield and hits Enter or Tab or Clicks on Dropdown -> destination_textfield is highlighted
    input to destination_textfield and Enter or Tab or clicks on Dropdown -> updateUI is called exactly once.
    Garching -> Garching-Hochbrück. User changes destination to HBF -> message appears that route is too long.
    */
    google.maps.event.addDomListener(document.getElementById('source_textfield'),'keydown',function(e){
        if(e.keyCode === 13 && $('.pac-item-selected').length == 0 && !e.triggered){ 
            google.maps.event.trigger(this,'keydown',{keyCode:40});
            google.maps.event.trigger(this,'keydown',{keyCode:13,triggered:true});
            if(feedbackObject.sString === $('#source_textfield').val()){
               $("#destination_textfield").focus();
            }
        }
        else if(e.keyCode === 9 && $('.pac-item-selected').length == 0){
            e.preventDefault();
            google.maps.event.trigger(this,'keydown',{keyCode:40});
        }
    });
    google.maps.event.addDomListener(document.getElementById('destination_textfield'),'keydown',function(e){
        if(e.keyCode === 13 && $('.pac-item-selected').length == 0 && !e.triggered){
            e.preventDefault();
            if($(".pac-container").eq(1).is(':visible')){ // only if the dropdown menu is visible
                google.maps.event.trigger(this,'keydown',{keyCode:40});
                google.maps.event.trigger(this,'keydown',{keyCode:13,triggered:true});
            }
            else if(feedbackObject.dString === $('#destination_textfield').val()){
                // when the autocomplete menu isn't visible, the place_changed-listener isn't called and thus 
                // we need to call updateUI here (but only if no gibberish was entered.)
                updateUI();
            }
            $("#destination_textfield").blur();
            return false; // this is important so that the other place_changed-event is triggered and updateUI is called exactly once.
        }
        else if(e.keyCode === 9 && $('.pac-item-selected').length == 0){
            e.preventDefault();
            google.maps.event.trigger(this,'keydown',{keyCode:40});
        }
    });
    // automatically select the whole text when clicking inside a textfield:
    $("#source_textfield, #destination_textfield").focus(function(){
       $(this).select();
    });
    
    // add listener to source textbox:
    google.maps.event.addListener(source, 'place_changed', function(){
        deleteAllPlaceMarkers();
        deletePath();
        resetUI();

        var place = source.getPlace();
        if(!place.geometry){
            $('#source_textfield').blur();
            if(typeof feedbackObject.sString === "undefined"){
                $('#source_textfield').val("");
            }
            else{
                $('#source_textfield').val(feedbackObject.sString);
            }
            return;
        }

        source_marker.setPosition(place.geometry.location);
        source_marker.setTitle($('#source_textfield').val()+' (drag to adjust position)');
        // add info window for starting point:
        if(source_marker.infowindow == null){
            source_marker.infowindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(-8, 0)
            });
            google.maps.event.addListener(source_marker, 'click', function(){
                if(currentlyOpenInfoWindow != null){ // close any other open infowindow
                    currentlyOpenInfoWindow.close();
                }
                source_marker.infowindow.open(map, source_marker);
                currentlyOpenInfoWindow = source_marker.infowindow;
            });
            google.maps.event.addListener(source_marker.infowindow, 'closeclick', function(){
               currentlyOpenInfoWindow = null;
            });
        }
        source_marker.infowindow.setContent('<h3>Starting Point: '+$('#source_textfield').val()+'</h3><p>(drag to adjust position)</p>');
        if(destination_marker.position){ // add line between source and destination if destination_marker already exists
            $("#destination_textfield").select();
            updateBounds([source_marker.position, destination_marker.position]);
        }
        else{
            $("#destination_textfield").focus();
            map.setCenter(place.geometry.location);
        }
    });
    
    // add destination marker:
    destination_marker = new google.maps.Marker({
        position: null,
        map: map,
        animation: google.maps.Animation.DROP,
        draggable: true,
        raiseOnDrag: false,
        title: 'Destination',
        infowindow: null,
        icon: 'http://maps.google.com/mapfiles/'+iconsForCategories[8]
    });
    google.maps.event.addListener(destination_marker, 'dragend', function(){
        geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            latLng: destination_marker.getPosition()
        }, function(results, status){
            var placeName;
            if(status == google.maps.GeocoderStatus.OK){
                placeName = results[0].formatted_address;
            } 
            else{
                placeName = destination_marker.getPosition();
            }
            $('#destination_textfield').blur();
            $('#destination_textfield').val(placeName);
            destination_marker.setTitle(placeName+' (drag to adjust position)');
            destination_marker.infowindow.setContent('<h3>End Point: '+placeName+'</h3><p>(drag to adjust position)</p>');
            updateUI();
        });
    });
    
    // add listener to destination textbox:
    google.maps.event.addListener(destination, 'place_changed', function(){
        var place = destination.getPlace();
        if(!place.geometry){
            return;
        }
        destination_marker.setPosition(place.geometry.location);
        destination_marker.setTitle($('#destination_textfield').val()+' (drag to adjust position)');
        // add info window for end point:
        if(destination_marker.infowindow == null){
            destination_marker.infowindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(-8, 0)
            });
            google.maps.event.addListener(destination_marker, 'click', function(){
                if(currentlyOpenInfoWindow != null){ // close any other open infowindow
                    currentlyOpenInfoWindow.close();
                }
                destination_marker.infowindow.open(map, destination_marker);
                currentlyOpenInfoWindow = destination_marker.infowindow;
            });
            google.maps.event.addListener(destination_marker.infowindow, 'closeclick', function(){
               currentlyOpenInfoWindow = null;
            });
        }
        destination_marker.infowindow.setContent('<h3>End Point: '+$('#destination_textfield').val()+'</h3><p>(drag to adjust position)</p>');
        if(source_marker.position){ // add line between source and destination if source_marker already exists
            updateUI();
            updateBounds([source_marker.position, destination_marker.position]);
        }
        else{
            map.setCenter(place.geometry.location);
        }
    });
}

function geolocate(){
    if(navigator.geolocation){
        $("#geolocationButton").blur();
        navigator.geolocation.getCurrentPosition(function(pos){
            var latLng = {lat: pos.coords.latitude, lng: pos.coords.longitude};
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                latLng: latLng
            }, function(results, status){
                if(status == google.maps.GeocoderStatus.OK){
                    currentPosition = results[0].formatted_address;
                } 
                else{
                    currentPosition = source_marker.getPosition();
                }
                $('#source_textfield').val(currentPosition);
                deleteAllPlaceMarkers();
                deletePath();
                resetUI();
                source_marker.setPosition(latLng);
                source_marker.setTitle(currentPosition+" (drag to adjust position)");
                // add info window for starting point:
                if(source_marker.infowindow == null){
                    source_marker.infowindow = new google.maps.InfoWindow({
                        pixelOffset: new google.maps.Size(-8, 0)
                    });
                    google.maps.event.addListener(source_marker, 'click', function(){
                        if(currentlyOpenInfoWindow != null){ // close any other open infowindow
                            currentlyOpenInfoWindow.close();
                        }
                        source_marker.infowindow.open(map, source_marker);
                        currentlyOpenInfoWindow = source_marker.infowindow;
                    });
                    google.maps.event.addListener(source_marker.infowindow, 'closeclick', function(){
                       currentlyOpenInfoWindow = null;
                    });
                }
                source_marker.infowindow.setContent('<h3>Starting Point: '+currentPosition+'</h3><p>(drag to adjust position)</p>');
                if(destination_marker.position){ // add line between source and destination if destination_marker already exists
                    updateBounds([source_marker.position, destination_marker.position]);
                }
                else{
                    map.setCenter(latLng);
                }
                $("#destination_textfield").focus();
            });
        });
    }
}

/*
    we divide the places into parts of 10 or fewer positions
    because the maps-API only supports 8 waypoints plus origin
    and destination in the free version.
    Warning: This generates a lot of requests for large routes.
*/
function prepareRouteRequests(positions, color, implementationID){
    if(positions.length > 1){
        currentDirectionDisplayIndex = 0;
        actualWalkingTime = [0, 0];
        actualDistance = [0, 0];
        // 2-10 nodes: 1 route, 11-19 nodes: 2 routes, 20-28 nodes: 3 routes, etc.
        var amountOfSubRoutes = Math.ceil((positions.length-1)/9.0);
        for(var i = 0; i < amountOfSubRoutes; i++){
            directionsDisplays[implementationID][i] = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                preserveViewport: true,
                polylineOptions: {
                    strokeColor: color,
                    strokeOpacity: routesOpacity[implementationID],
                    icons: [
                    {
                        icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: '1.7'
                        },
                        offset: '50%',
                        repeat:'100px'
                    }]
                }
            });
            directionsDisplays[implementationID][i].setMap(map);
            /* indices:
            i=0:  0  1  2  3  4  5  6  7  8  9
            i=1:  9 10 11 12 13 14 15 16 17 18
            i=2: 18 19 20 21 22 23 24 25 26 27
            i=3: 27 28 29 30 31 32 33 34 35 36
            i=4: 36 37 38 39 40 41 42 43 ...
            */
            var firstIndex = 9*i;
            var lastIndex = 9*(i+1);
            if(lastIndex > positions.length-1){
                lastIndex = positions.length-1;
            }
            var waypoints = [];
            for(var j = firstIndex+1; j < lastIndex; j++){
                waypoints.push({
                    location: positions[j]
                });
            }
            directionDisplayRequests[implementationID][i] = {
                origin: positions[firstIndex],
                destination: positions[lastIndex],
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.WALKING
            };
        }
    }
}

function showRoute(implementationID){
    var color = routesColor[implementationID];
    var opacity = 1;
    for(var i = 0; i < directionsDisplays[implementationID].length; i++){
        directionsDisplays[implementationID][i].setOptions({
            polylineOptions: {
                strokeOpacity: opacity,
                strokeColor: color
            },
            map: map
        });
    }
    for(var i = 0; i < place_markers[implementationID].length; i++){
        place_markers[implementationID][i].setMap(map);
    }
    routesOpacity[implementationID] = opacity;
}

function hideRoute(implementationID){
    for(var i = 0; i < directionsDisplays[implementationID].length; i++){
        directionsDisplays[implementationID][i].setOptions({
            polylineOptions: {
                strokeOpacity: 0
            },
            map: map
        });
    }
    if(currentlyOpenInfoWindow != null){ // close any open infowindow
        currentlyOpenInfoWindow.close();
    }
    currentlyOpenInfoWindow = null;
    for(var i = 0; i < place_markers[implementationID].length; i++){
        place_markers[implementationID][i].setMap(null);
    }
    routesOpacity[implementationID] = 0;
}

function renderAllRoutes(){
    var routeIDToRenderFirst = routesColor.indexOf("#25ACF6"); // always render the blue route first, no matter if it is the baseline or the ownImpl.
    directionsService.route(directionDisplayRequests[routeIDToRenderFirst][0], function(response, status){
        processRoute(response, status, 1, routeIDToRenderFirst);
    });
}

function processRoute(response, status, attempt, implementationID){
    if(status == google.maps.DirectionsStatus.OK){
        directionsDisplays[implementationID][currentDirectionDisplayIndex].setDirections(response);
        currentDirectionDisplayIndex = (currentDirectionDisplayIndex+1) % directionsDisplays[implementationID].length;
        for(var i = 0; i < response.routes[0].legs.length; i++){
            if(typeof response.routes[0].legs[i].duration !== "undefined"){
                actualWalkingTime[implementationID] += response.routes[0].legs[i].duration.value;
                actualDistance[implementationID] += response.routes[0].legs[i].distance.value;
            }
        }
        if(currentDirectionDisplayIndex == 0){
            if(routesColor.indexOf("#25ACF6") == implementationID){
                $("#walkingTimeLabelBlue").html("Walking distance: "+actualDistance[implementationID]+" meters<br>Estimated walking time: "+(actualWalkingTime[implementationID]/60).toFixed(0)+" mins");
                $("#walkingTimeLabelBlue").css('display', 'block');
                // we are only done with the first route. Now do the second route.
                directionsService.route(directionDisplayRequests[(implementationID+1)%2][0], function(response, status){
                    processRoute(response, status, 1, (implementationID+1)%2);
                });
            }
            else{
                $("#walkingTimeLabelRed").html("Walking distance: "+actualDistance[implementationID]+" meters<br>Estimated walking time: "+(actualWalkingTime[implementationID]/60).toFixed(0)+" mins");
                $("#walkingTimeLabelRed").css('display', 'block');
            }
        }
        else{ // there still some routes to render.
            directionsService.route(directionDisplayRequests[implementationID][currentDirectionDisplayIndex], function(response, status){
                processRoute(response, status, 1, implementationID);
            });
        }
    }
    // if we send too many requsts we have to wait a bit and then try again.
    else if(status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT){
        if(attempt > 10){
            showModal("Sorry, couldn't render route completely :(<br><br>Please try again later.");
        }
        else{
            setTimeout(function(){
                directionsService.route(directionDisplayRequests[implementationID][currentDirectionDisplayIndex], function(response, status){
                    processRoute(response, status, attempt+1, implementationID);
                });
            }, 500);
        }
    }
    else{
        showModal("Sorry, the Google Directions Service returned an error: "+status+"<br><br>Please try again later.");
    }
}

function addPlaceMarker(place, implementationID, isInBothRoutes){
    var markerIsSourceOrDestination = predefinedCategoryStrings[place.predefinedCategory] == 'source' || predefinedCategoryStrings[place.predefinedCategory] == 'destination';
    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(place.lat, place.lng),
        map: map,
        //animation: google.maps.Animation.DROP,
        title: place.name,
        visible: !markerIsSourceOrDestination, // this prevents that there are two source/destination-markers visible.
        // But they are needed here so that the path is displayed correctly.
        icon: 'http://maps.google.com/mapfiles/'+iconsForCategories[place.predefinedCategory]
    });
    if(routesOpacity[implementationID] == 0){
        marker.setMap(null);
    }
    if(!markerIsSourceOrDestination){
        var priceTier = '';
        switch(place.priceTier){
            case 1: priceTier = '<li>Price tier: <span>Cheap</span></li>';
            break;
            case 2: priceTier = '<li>Price tier: <span>Moderate</span></li>';
            break;
            case 3: priceTier = '<li>Price tier: <span>Expensive</span></li>';
            break;
            case 4: priceTier = '<li>Price tier: <span>Very Expensive</span></li>';
            break;
        }
        var routeInfo;
        if(isInBothRoutes){
            routeInfo = '<li>This venue is both in the <span style="color: #25ACF6">blue</span> and in the <span style="color: #FF593E">red</span> route.</li>';
        }
        else if(implementationID == routesColor.indexOf("#25ACF6")){
            routeInfo = '<li>This venue is in the <span style="color: #25ACF6">blue</span> route.</li>';
        }
        else{
            routeInfo = '<li>This venue is in the <span style="color: #FF593E">red</span> route.</li>';
        }
        var isOpen = '';
        if(place.isOpen == true){
            isOpen = '<li>This place is <span>open</span> right now</li>';
        }
        else if(place.isOpen == false){
            isOpen = '<li>This place is <span>not open</span> right now</li>';
        }
        var infowindow = new google.maps.InfoWindow({
            content: '<h4>'+place.name+'</h4>'+
            '<ul class="myInfoWindow">'+
            '<li>Category: <span>'+printablePredefinedCategoryStrings[place.predefinedCategory]+'</span></li>'+
            '<li>Subcategory: <span>'+place.categoryName+'</span></li><hr>'+
            '<li><span>'+place.checkinsCount+'</span> Foursquare users were here</li>'+
            '<li><span>'+place.likes+'</span> Foursquare users liked this place</li><hr>'+
            priceTier+
            isOpen+
            '<li><span>'+place.hereNow+'</span> Foursquare users are here right now</li><hr>'+
            '<li>Rating: <span>'+place.rating+'/10</span></li><hr>'+
            routeInfo+
            '</ul>'
        });
        google.maps.event.addListener(marker, 'click', function(){
            if(currentlyOpenInfoWindow != null){ // close any other open infowindow
                currentlyOpenInfoWindow.close();
            }
            infowindow.open(map, marker);
            currentlyOpenInfoWindow = infowindow;
        });
        google.maps.event.addListener(infowindow, 'closeclick', function(){
           currentlyOpenInfoWindow = null;
        });
    }
    place_markers[implementationID].push(marker);
    return marker;
}

// careful: O(n^2)
function determinePlacesThatAreInBothRoutes(places1, places2){
    var ret = [[], []];
    for(var i = 0; i < places1.length; i++){
        for(var j = 0; j < places2.length; j++){
            if(places1[i].id == places2[j].id){
                ret[0].push(i);
                ret[1].push(j);
            }
        }
    }
    return ret;
}

function addPaths(placesBlue, implementationIDBlue, placesRed, implementationIDRed){
    var placesInBothRoutes = determinePlacesThatAreInBothRoutes(placesBlue, placesRed);
    // add new markers:
    var positions1 = [];
    for(var i = 0; i < placesBlue.length; i++){
        var m = addPlaceMarker(placesBlue[i], implementationIDBlue, (placesInBothRoutes[0].indexOf(i)>0) );
        positions1.push(m.position);
    }
    var positions2 = [];
    for(var i = 0; i < placesRed.length; i++){
        var m = addPlaceMarker(placesRed[i], implementationIDRed, (placesInBothRoutes[1].indexOf(i)>0) );
        positions2.push(m.position);
    }
    prepareRouteRequests(positions1, routesColor[implementationIDBlue], implementationIDBlue);
    prepareRouteRequests(positions2, routesColor[implementationIDRed], implementationIDRed);
    renderAllRoutes();
    updateBounds(positions1);
}

function updateBounds(positions){
    var bounds = new google.maps.LatLngBounds();
    for(var i = 0; i < positions.length; i++){
        bounds.extend(positions[i]);
    }
    map.fitBounds(bounds);
}

function deleteAllPlaceMarkers(){
    if(currentlyOpenInfoWindow != null){ // close any open infowindow
        currentlyOpenInfoWindow.close();
    }
    currentlyOpenInfoWindow = null;
    for(var i = 0; i < place_markers[baselineID].length; i++){
        place_markers[baselineID][i].setMap(null);
    }
    for(var i = 0; i < place_markers[ownImplID].length; i++){
        place_markers[ownImplID][i].setMap(null);
    }
    place_markers = [[], []];
    //var divHeight = $("#feedbackOptionsContainer").outerHeight(true);
    //$("#feedbackOptionsContainer").css('margin-top', '-'+divHeight+'px');
    //$("#placeTable").css('display', 'none');
    //$("#walkingTimeLabel").css('display', 'none');
}

function deletePath(){
    if(directionsDisplays != null){
        for(var i = 0; i < directionsDisplays[baselineID].length; i++){
            directionsDisplays[baselineID][i].setMap(null);
        }
        for(var i = 0; i < directionsDisplays[ownImplID].length; i++){
            directionsDisplays[ownImplID][i].setMap(null);
        }
        directionsDisplays = [[], []];
        directionDisplayRequests = [[], []];
    }
}

google.maps.event.addDomListener(window, 'load', initialize);