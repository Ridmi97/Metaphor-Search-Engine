'use strict'

const express = require('express');
const router = express.Router();

const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

var keywords = require("../../data/keywords.json");
var named_entities = require("../../data/splited_entities.json");

router.post('/', async function (req, res) {
    var query = req.body.query;
    var query_words = query.trim().split(" ");
    var removing_query_words = [];

    var size = 100;

    var field_type = '';

    // initialize variables of weighting scheme
    var boost_of_singers = 1;
    var boost_of_title = 1;
    var boost_of_composer = 1;
    var boost_of_lyricist = 1;
    var boost_of_album = 1;
    var boost_of_year = 1;
    var boost_of_metaphor = 1;
    var boost_of_source_word = 1;
    var boost_of_target_word = 1;
    var sorting = 0;
    var range = 0;
    var sort_method = [];

    field_type = 'cross_fields';
    query_words.forEach(word => {
        word = word.replace('ගේ', '');
        word = word.replace('යන්ගේ', '');
        // weighted scheme
        if (named_entities.singers_splits.includes(word)) {
            boost_of_singers = boost_of_singers + 1;
        }
        if (named_entities.lyricists_splits.includes(word)) {
            boost_of_lyricist = boost_of_lyricist + 1;
        }
        if (named_entities.composers_splits.includes(word)) {
            boost_of_composer = boost_of_composer + 1;
        }
        if (named_entities.albums_splits.includes(word)) {
            boost_of_album = boost_of_album + 1;
        }
        if (named_entities.source_domain_splits.includes(word)) {
            boost_of_source_word = boost_of_source_word + 1;
        }
        if (named_entities.target_domain_splits.includes(word)) {
            boost_of_target_word = boost_of_target_word + 1;
        }
        if (named_entities.titles_splits.includes(word)) {
            boost_of_title = boost_of_title + 1;
        }

        // weighting and removing unnecessary words
        if (keywords.singers.includes(word)) {
            boost_of_singers = boost_of_singers + 1;
            removing_query_words.push(word);
        }
        if (keywords.lyricist.includes(word)) {
            boost_of_lyricist = boost_of_lyricist + 1;
            removing_query_words.push(word);
        }
        if (keywords.composer.includes(word)) {
            boost_of_composer = boost_of_composer + 1;
            removing_query_words.push(word);
        }
        if (keywords.album.includes(word)) {
            boost_of_album = boost_of_album + 1;
            removing_query_words.push(word);
        }
        if (keywords.year.includes(word)) {
            boost_of_year = boost_of_year + 1;
            removing_query_words.push(word);
        }
        if (keywords.metaphor.includes(word)) {
            boost_of_metaphor = boost_of_metaphor + 1;
            removing_query_words.push(word);
        }
        if (keywords.songs.includes(word)) {
            removing_query_words.push(word);
        }
        if (!isNaN(word)) {
            range = parseInt(word);
            removing_query_words.push(word);
        }
    });


    if (range == 0 && sorting > 0) {
        size = 10;
        sort_method = [{ viewCount: { order: "desc" } }];
    } else if (range > 0 || sorting > 0) {
        size = range;
        sort_method = [{ viewCount: { order: "desc" } }];
    }
        

    removing_query_words.forEach(word => {
        query = query.replace(word, '');
    });
    
    var max = Math.max(boost_of_singers, boost_of_title, boost_of_lyricist, boost_of_composer, boost_of_album, boost_of_year)
    // nested query to get inner hits 
    if (boost_of_source_word>= max || boost_of_target_word>= max){       
        var result_query = {
                nested: {
                    path: "metaphors",
                    query: {
                    fuzzy: {
                            "metaphors.metaphor": {
                                "value": query.trim(),
                                "fuzziness": "1"
                            }
                        }
                    },
                    inner_hits: {
                        name : "matching_metaphors",
                        size: 10,
                        _source: ["metaphors.metaphor","metaphors.interpretation","metaphors.source_domain","metaphors.target_domain"]
                    }
                    
                }
            }
        // fields to be included in the results    
        var result_includes = ["singers", "title", "lyricist","lyrics", "composer", "album", "year"]
    }else{
        // weighted query
        var result_query = {
                multi_match: {
                    query: query.trim(),
                    fields: [`singers^${boost_of_singers}`, `title^${boost_of_title}`, `lyricist^${boost_of_lyricist}`,
                    `composer^${boost_of_composer}`, `album^${boost_of_album}`, `year^${boost_of_year}`, `metaphors.source_domain^${boost_of_source_word}`,
                    `metaphors.target_domain^${boost_of_target_word}`],
                    operator: "or",
                    type: field_type
                }
            }
        var result_includes = ["singers", "title", "lyricist","lyrics", "composer", "album", "year", "metaphors.metaphor", "metaphors.interpretation","metaphors.source_domain", "metaphors.target_domain"]
    }

    removing_query_words.forEach(word => {
        query = query.replace(word, '');
    });

    var index= 'sinhala-metaphor-songs'
    var result = await client.search({
        index,
        body: {
            _source: {
                includes: result_includes
            },
            query: result_query,
            aggs: {
                "singers_filter": {
                    terms: {
                        field: "singers.keyword",
                        size: 10
                    }
                },
                "composer_filter": {
                    terms: {
                        field: "composer.keyword",
                        size: 10
                    }
                },
                "lyricist_filter": {
                    terms: {
                        field: "lyricist.keyword",
                        size: 10
                    }
                },
                "album_filter": {
                    terms: {
                        field: "album.keyword",
                        size: 10
                    }
                }
            }
        }
       });
    
       //get inner hit counts
    result.body.hits.hits.forEach(song => {
        var lis = []
        if (song.inner_hits){
            var inner_hit = song.inner_hits.matching_metaphors.hits.hits[0]._source 
            lis.push(inner_hit)
            song._source.metaphors = lis;
            delete song.inner_hits;
        }        
    });

    res.send({
        aggs: result.body.aggregations,
        hits: result.body.hits.hits
    });
});

module.exports = router;