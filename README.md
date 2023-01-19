# Sinhala Songs Metaphor-Search-Engine

The project done for module CS4642 - Data Mining & Information Retrieval

## Introduction
This contains the source code for sinhala songs metaphor search engine developed using [Elasticsearch](https://www.elastic.co/) as the search engine and [NodeJS](https://nodejs.org/en/) and [Angular](https://angular.io/) as the back-end and front-end web frameworks respectively.  

The search engine contains 102 songs. The songs were extracted manually. The search engine offers following features for the users.

* Searching metaphors using singer, lyricist, composer, album, title of the song and metaphor.

* Faceted search - Users will be able to filter their search results based on singer, Lyricist, Composer, and Album.

* Query classification to boost the results - Search engine is able to scan and identify special words like 'ගැයූ', 'ගයන', 'ගායකයා' in the query to weigh the search towards composers.

* Users will be able to get more details on each search result such as year.

## Dataset
* title - title of the song
* singers - singers of the song
* lyrics - lyrics of the song with line breakers
* lyricist - lyricist of the song
* composer - composer of the song
* album - album of the song
* year - year published
* metaphors - metaphors of the song
* metaphor - metaphor included in the song
* source domain - metaphor assigned to
* target domain - metaphor refers to
* interpretation - breif interpretation of the metaphor

## Prerequisites
* ElasticSearch v7.9.1
* Kibana v7.9.1 (Optional)
* NodeJS v18.13.0
* Angular v15.1.0

## Used Techniques
* Tokenization
* Stop Token Filtering
* Field Boosting
* Nested queries for filter inner hits 
* Facets/ Aggregations

## How to Setup
* After downloading ElasticSearch, install ICU Analyser plugin by running sudo bin/elasticsearch-plugin install analysis-icu in order to activate the ICU Tokenizer
* Start an ElasticSearch instance on port 9200
* Start a Kibana instance if you need to view the indexes
* Run npm install followed by node index_pattern.js inside elasticsearch directory to create the index and index the songs
* Run npm install followed by npm start * inside search-engine-backend directory
Run npm install followed by ng serve * inside search-engine-frontend directory
Open the browser and goto localhost:4200

