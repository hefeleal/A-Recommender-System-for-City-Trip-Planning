<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Recommender System</title>

    <link rel="shortcut icon" href="img/favicon.ico">
    <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <link href="bootstrap-slider/css/bootstrap-slider.min.css" rel="stylesheet">
    <link href="bootstrap-toggle/css/bootstrap-toggle.min.css" rel="stylesheet">
    <link href="main.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <?php
      $filename = 'pageviews.txt';
      $pageviews = file_get_contents($filename);
      $file = fopen($filename, 'w+');
      fwrite($file, $pageviews + 1);
      fclose($file);
    ?>
    <div id="universalModal" class="modal fade">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span>&times;</span></button>
            <h4 class="modal-title">Error</h4>
          </div>
          <div class="modal-body">
            <p></p>
          </div>
        </div>
      </div>
    </div>
    <div id="feedbackBanner">
      <a>&laquo;&nbsp;feedback</a>
    </div>

    <div class="jumbotron">
      <div class="container">
        <h1>A Recommender System <small>for City Trip Planning</small></h1>
        <p style="font-size: 18px;">Welcome to my bachelor's project! The goal of this website is to propose interesting locations between two points within one city. When you walk this route, you know what places (like bars or sights) you could visit on the way.</p>
        <p style="font-weight: bold;">Instructions:</p>
        <ul style="font-size: 18px;">
          <li>Rate each of the following categories on a scale from 0 (no places are going to be suggested) to 5 (places in this category will be strongly preferred if possible).</li>
          <li>Specify whether you want to perform the trip within a certain time and budget limit or not. Feel free to try out both options!</li>
          <li>Enter a starting point and an end point for your trip. These must be within walking distance (5 kilometers)! Also, I suggest entering points in a large city, like Munich or Berlin, because there will be a lot more results available than for a small town.</li>
          <li>The system will suggest two routes for you. By clicking on the markers in the map, you get additional information for each place.</li>
          <li>Please rate which route you like better or seems more fitting to you. You can submit feedback in the box that appears at the very bottom of the page after entering start and end point.</li>
          <li>Feel free to try out and rate as many different routes as you like!</li>
        </ul><br>
        <p class="mobileOnly" style="font-size: 14px;">Note: This site should work on mobile devices. However, if you are experiencing any problems or unexpected behavior, please try again on a desktop computer with a modern web browser.</p>
      </div>
    </div>
    </div>

    <div class="container">
      <div class="panel panel-primary">
        <div class="panel-heading">
            Enter your preferences
        </div>
        <div class="panel-body" style="padding-top: 0px;">
          <div class="row">
            <div class="col-lg-4 col-md-6">
              <div id="museum" style="background-color: #FF9637">
                <h3><img class="categoryIcon" src="img/museum.png">Sights &amp; Museums</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="museum" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="museum" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="museum" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="museum" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="museum" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="museum" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div id="nightlife" style="background-color: #8E67FD">
                <h3><img class="categoryIcon" src="img/nightlife.png">Night Life</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="nightlife" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nightlife" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nightlife" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="nightlife" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nightlife" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nightlife" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div id="food" style="background-color: #FDF569">
                <h3><img class="categoryIcon" src="img/food.png">Food</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="food" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="food" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="food" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="food" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="food" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="food" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div id="nature" style="background-color: #00E64D">
                <h3><img class="categoryIcon" src="img/nature.png">Outdoors &amp; Recreation</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="nature" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nature" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nature" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="nature" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nature" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="nature" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div id="music" style="background-color: #E661AC">
                <h3><img class="categoryIcon" src="img/music.png">Music &amp; Events</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="music" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="music" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="music" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="music" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="music" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="music" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <div id="shopping" style="background-color: #67DDDD">
                <h3><img class="categoryIcon" src="img/shopping.png">Shopping</h3>
                <div class="btn-group" data-toggle="buttons">
                  <label class="btn btn-info">
                    <input type="radio" name="shopping" value="0" autocomplete="off">0
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="shopping" value="1" autocomplete="off">1
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="shopping" value="2" autocomplete="off">2
                  </label>
                  <label class="btn btn-info active">
                    <input type="radio" name="shopping" value="3" autocomplete="off" checked>3
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="shopping" value="4" autocomplete="off">4
                  </label>
                  <label class="btn btn-info">
                    <input type="radio" name="shopping" value="5" autocomplete="off">5
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel panel-primary">
        <div class="panel-heading">
            Time and budget limit
        </div>
        <div class="panel-body">
          <p>If you'd like to, you can specify how long the trip should take at most and how much money you want to spend. Note that time and money values for each location are only estimates.</p>
          <p>Alternatively, disabling this option will not take time or cost into account and will therefore return much more venues. However, it is not intended for you to visit every location on the list but rather pick some of the suggested places on the way.</p>
          <p>Both options will optimize the route to match your interests.</p>

          <div class="row">
            <div class="col-sm-2" style="margin-top:10px">
              <input id="constraintBased" autocomplete="off" data-toggle="toggle" data-onstyle="success" data-on="Enabled" data-off="Disabled" type="checkbox">
            </div>
            <div class="col-sm-5" style="margin-top:10px">
              <div class="input-group">
                <input type="text" autocomplete="off" disabled class="form-control" placeholder="Enter your time" id="time">
                <span class="input-group-addon">min</span>
              </div>
            </div>
            <div class="col-sm-5" style="margin-top:10px">
              <div class="input-group">
                <input type="text" autocomplete="off" disabled class="form-control" placeholder="Enter your budget" id="budget">
                <span class="input-group-addon">&euro;</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel panel-primary">
        <div class="panel-heading">
          Enter your starting and end point
        </div>
        <div class="panel-body">
          <div class="row">
            <div class="col-sm-6" style="margin-top:10px">
              <div class="input-group">
                <span class="input-group-addon shrinkPadding shrinkText">starting point</span>
                <input type="text" autocomplete="off" class="form-control" placeholder="Enter a position" id="source_textfield">
                <span class="input-group-btn">
                    <button id="geolocationButton" class="btn btn-default shrinkPadding" type="button" data-toggle="tooltip" data-placement="top" title="Click to use your current position" onclick="geolocate();"><span class="glyphicon glyphicon-screenshot shrinkText"></span></button>
               </span>
              </div>
            </div>
            <div class="col-sm-6" style="margin-top:10px">
              <div class="input-group">
                <input type="text" autocomplete="off" class="form-control" placeholder="Enter a position" id="destination_textfield">
                <span class="input-group-addon shrinkPadding shrinkText">end point</span>
              </div>
            </div>
          </div>
          <br>
          <div class="row">
            <div class="col-xs-12 col-sm-1">
              <div id="museumSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Sights&nbsp;&amp;&nbsp;Museums" class="iconSidebarElement" style="background-color: #FF9637;">
                <img src="img/museum.png">
              </div>
              <div id="nightlifeSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Night&nbsp;Life" class="iconSidebarElement" style="background-color: #8E67FD;">
                <img src="img/nightlife.png">
              </div>
              <div id="foodSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Food" class="iconSidebarElement" style="background-color: #FDF569;">
                <img src="img/food.png">
              </div>
              <div id="natureSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Outdoors&nbsp;&amp;&nbsp;Recreation" class="iconSidebarElement" style="background-color: #00E64D;">
                <img src="img/nature.png">
              </div>
              <div id="musicSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Music&nbsp;&amp;&nbsp;Events" class="iconSidebarElement" style="background-color: #E661AC;">
                <img src="img/music.png">
              </div>
              <div id="shoppingSidebarIcon" data-toggle="tooltip" data-placement="top" data-html="true" title="Shopping" class="iconSidebarElement" style="background-color: #67DDDD;">
                <img src="img/shopping.png">
              </div>
            </div>
            <div class="col-xs-12 col-sm-11">
              <div id="map-canvas"></div>
            </div>
          </div>
          <div id="visibilityRow" class="row" style="margin-top: 20px;">
            <div class="col-sm-4 col-md-3 col-lg-2">
              <p>Show route one:</p>
            </div>
            <div class="col-sm-2 col-md-3 col-lg-4">
              <input id="toggleRouteBlue" checked autocomplete="off" data-toggle="toggle" data-onstyle="primary" data-on="Visible" data-off="Hidden" type="checkbox">
            </div>
            <div class="col-sm-4 col-md-3 col-lg-2">
              <p>Show route two:</p>
            </div>
            <div class="col-sm-2 col-md-3 col-lg-4">
              <input id="toggleRouteRed" checked autocomplete="off" data-toggle="toggle" data-onstyle="danger" data-on="Visible" data-off="Hidden" type="checkbox">
            </div>
          </div>
          <div class="row">
            <div style="z-index:5;" class="col-sm-6">
              <p id="walkingTimeLabelBlue"></p>
            </div>
            <div style="z-index:5;" class="col-sm-6">
              <p id="walkingTimeLabelRed"></p>
            </div>
          </div>
        </div>
      </div>

      <div id="placeTablesPanel" class="panel panel-primary">
        <div class="panel-heading">
          Overview of all places
        </div>
        <div class="panel-body">
          <div class="row">
            <div class="col-md-6">
              <div class="placeTableDiv">
                <table id="placeTableBlue" style="display:none;" cellpadding="3" cellspacing="0">
                </table>
              </div>
            </div>
            <div class="col-md-6">
              <div class="placeTableDiv">
                <table id="placeTableRed" style="display:none;" cellpadding="3" cellspacing="0">
                </table>
              </div>
            </div>
          </div>
          <p id="placeTableFootnote"></p>
        </div>
      </div>

      <div  id="feedbackOptionsContainer">
        <div id="feedbackOptionsFlipper">
          <div id="feedbackOptions" class="panel panel-primary">
            <div class="panel-heading">
              Please take a minute to rate the quality of the result. All feedback is submitted anonymously.
            </div>
            <div class="panel-body">
              <ul class="nav nav-tabs">
                <li class="active">
                  <a style="background-color:#25ACF6; outline:none;" data-toggle="tab" href="#one">Route one</a>
                </li>
                <li>
                  <a style="background-color:#FF593E; outline:none;" data-toggle="tab" href="#two">Route two</a>
                </li>
              </ul>
              <div class="tabbable">
                <div class="tab-content" style="margin-bottom:20px; border-bottom:1px solid black; border-left:1px solid black; border-right:1px solid black;">
                  <div style="background-color:#25ACF6;" id="one" class="tab-pane fade in active">
                    <br>
                    <table id="feedbackTable">
                      <tr>
                        <td>
                          <p>The total amount of places was...</p>
                        </td>
                        <td>
                          <p>too low</p>
                        </td>
                        <td>
                          <input id="sliderBlue1" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>too high</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>The length of the path was..</p>
                        </td>
                        <td>
                          <p>too short</p>
                        </td>
                        <td>
                          <input id="sliderBlue2" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>too long</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>How well did your received places match your preferences?</p>
                        </td>
                        <td>
                          <p>not at all</p>
                        </td>
                        <td>
                          <input id="sliderBlue3" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>perfectly</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>Would you consider taking this route yourself?</p>
                        </td>
                        <td>
                          <p>no</p>
                        </td>
                        <td>
                          <input id="sliderBlue4" type="text" data-slider-min="1" data-slider-max="3" data-slider-step="1" data-slider-value="2">
                        </td>
                        <td>
                          <p>yes</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>How satisfied are you with the overall result?</p>
                        </td>
                        <td>
                          <p>not satisfied</p>
                        </td>
                        <td>
                          <input id="sliderBlue5" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>very satisfied</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div style="background-color:#FF593E;" id="two" class="tab-pane fade">
                    <br>
                    <table id="feedbackTable2">
                      <tr>
                        <td>
                          <p>The total amount of places was...</p>
                        </td>
                        <td>
                          <p>too low</p>
                        </td>
                        <td>
                          <input id="sliderRed1" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>too high</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>The length of the path was..</p>
                        </td>
                        <td>
                          <p>too short</p>
                        </td>
                        <td>
                          <input id="sliderRed2" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>too long</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>How well did your received places match your preferences?</p>
                        </td>
                        <td>
                          <p>not at all</p>
                        </td>
                        <td>
                          <input id="sliderRed3" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>perfectly</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>Would you consider taking this route yourself?</p>
                        </td>
                        <td>
                          <p>no</p>
                        </td>
                        <td>
                          <input id="sliderRed4" type="text" data-slider-min="1" data-slider-max="3" data-slider-step="1" data-slider-value="2">
                        </td>
                        <td>
                          <p>yes</p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <p>How satisfied are you with the overall result?</p>
                        </td>
                        <td>
                          <p>not satisfied</p>
                        </td>
                        <td>
                          <input id="sliderRed5" type="text" data-slider-min="1" data-slider-max="5" data-slider-step="1" data-slider-value="3">
                        </td>
                        <td>
                          <p>very satisfied</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
              <div class="row" style="margin-bottom:10px; text-align: center;">
                <div class="col-xs-12">
                  <span class="feedbackLikeBetterText">Which route do you like better?</span>
                  <div class="btn-group" data-toggle="buttons" style="margin: 10px 15px; font-size: 16px;">
                    <label id="feedbackLikeBetterBlueRouteButton" class="btn feedbackLikeBetterText">
                      <input type="radio" name="feedbackLikeBetter" value="0" autocomplete="off">blue
                    </label>
                    <label id="feedbackLikeBetterNoRouteButton" class="btn feedbackLikeBetterText active">
                      <input type="radio" name="feedbackLikeBetter" value="2" autocomplete="off" checked>none
                    </label>
                    <label id="feedbackLikeBetterRedRouteButton" class="btn feedbackLikeBetterText">
                      <input type="radio" name="feedbackLikeBetter" value="1" autocomplete="off">red
                    </label>
                  </div>
                </div>
              </div>
              <div class="row" style="margin-bottom:20px;">
                <div class="col-sm-6" style="margin:0 auto; float: none;">
                  <label for="feedbackTextarea">Additional comments:</label>
                  <textarea autocomplete="off" class="form-control" rows="3" id="feedbackTextarea"></textarea>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 text-center">
                  <a id="feedbackButton" class="btn btn-lg" role="button">Submit feedback &raquo;</a>
                </div>
              </div>
            </div>
          </div>
          <div id="feedbackOptionsBackface" class="panel panel-primary">
            <div class="panel-heading"></div>
            <div class="panel-body" style="position: relative; top: 40%;"><h1 style="text-align:center; font-size:72px;">Thank you!</h1>
            </div>
          </div>
        </div>
      </div>
      <hr>

      <footer>
        <a href="http://foursquare.com" target="_blank"><img id="foursquareImg" src="img/foursquare.png"></a>
        <p class="shrinkText" style="color: #000;">&copy;&nbsp;<a href="http://www11.in.tum.de/lehrstuhl/personen/woerndl/" target="_blank">Wolfgang&nbsp;Wörndl</a>, Alexander&nbsp;Hefele&nbsp;2015</p>
        <p class="shrinkText" style="color: #000;">contact: <img class="kontaktImg" src="img/kontaktWoerndl.png">, <img class="kontaktImg" src="img/kontaktHefele.png"></p>
      </footer>
    </div>
    <div id="pageOverlay">
      <img id="spinnerIcon" src="img/ajax-loader.gif">
    </div>


    <script src="jquery/jquery-1.11.2.min.js"></script>

    <script src="bootstrap/js/bootstrap.min.js"></script>
    <script src="bootstrap-slider/js/bootstrap-slider.min.js"></script>
    <script src="bootstrap-toggle/js/bootstrap-toggle.min.js"></script>

    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places"></script>
    <script type="text/javascript" src="js/utilities.js"></script>
    <script type="text/javascript" src="js/classification_baseline.js"></script>
    <script type="text/javascript" src="js/classification_ownImpl.js"></script>
    <script type="text/javascript" src="js/algorithms_baseline.js"></script>
    <script type="text/javascript" src="js/algorithms_ownImpl.js"></script>
    <script type="text/javascript" src="js/map.js"></script>
    <script type="text/javascript" src="js/ui.js"></script>

  </body>
</html>