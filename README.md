# A Recommender System for City Trip Planning

This is my Bachelor's Project.

My task was to find interesting locations (like sights and bars) on a certain route. For that I created a website where you can specify a start and an end point within a city on a map. Then the system recommends, based on your interests, two routes between these points containing various Points Of Interest (POIs). One of the routes is a baseline approach based on the previous work by [Haris Iltifat](https://github.com/harisiltifat/) (which can be found [here](https://github.com/harisiltifat/Recommender-system-with-path-generation)). The other route represents my improvements, which include amongst other things the incorporation of [Pearson's Correlation Coefficient](https://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient) to better correlate the different POIs with the user's own interests.

## Results

I conducted a survey with over 120 participants and found out that my implementation received better ratings than the baseline approach.

## Implementation

This project uses the Foursquare API to suggest POIs and the Google Maps API to display the routes. The Front End is written with the help of Bootstrap and jQuery and the Back End is written in PHP and makes use of PostgreSQL.

## Try it out

You can test it live [here](http://vmschlichter21.informatik.tu-muenchen.de:8000/).