# A Recommender System for City Trip Planning

![Image of preferences setting](https://raw.githubusercontent.com/hefeleal/A-Recommender-System-for-City-Trip-Planning/master/screenshots/preferences.png)

![Image of map](https://raw.githubusercontent.com/hefeleal/A-Recommender-System-for-City-Trip-Planning/master/screenshots/map.png)

This is my Bachelor's Project.

My task was to find interesting locations (like sights and bars) on a certain route. For that I created a website where you can specify a start and an end point within a city on a map. Then the system recommends, based on your interests, two routes between these points containing various Points Of Interest (POIs). One of the routes is a baseline approach based on the previous work by [Haris Iltifat](https://github.com/harisiltifat/) (which can be found [here](https://github.com/harisiltifat/Recommender-system-with-path-generation)). The other route represents my improvements, which include amongst other things the incorporation of [Pearson's Correlation Coefficient](https://en.wikipedia.org/wiki/Pearson_product-moment_correlation_coefficient) to better correlate the different POIs with the user's own interests.

## Results

I conducted a survey with over 120 participants and found out that my implementation received better ratings than the baseline approach.

![Main result](https://raw.githubusercontent.com/hefeleal/A-Recommender-System-for-City-Trip-Planning/master/screenshots/main_result.png)

## Implementation

This project uses the Foursquare API to suggest POIs and the Google Maps API to display the routes. The Front End is written with the help of Bootstrap and jQuery and the Back End is written in PHP and makes use of PostgreSQL.

For a more detailled description of the project please refer to my [thesis](https://github.com/hefeleal/A-Recommender-System-for-City-Trip-Planning/blob/master/thesis/thesis.pdf).

## Try it out

You can test it live [here](http://vmschlichter21.informatik.tu-muenchen.de:8000/).

## Further reading

We submitted a research paper on this topic to the ENTER 2016 conference. It received the third price of the best research paper award and was published in [Information and Communication Technologies in Tourism 2016](http://www.springer.com/de/book/9783319282305) (pages 441 - 453). You can download it [here](http://link.springer.com/chapter/10.1007%2F978-3-319-28231-2_32) (`DOI 10.1007/978-3-319-28231-2_32`).