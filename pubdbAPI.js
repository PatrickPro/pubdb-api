/**
 * Created by patrickpro on 26/12/14.
 */
var express = require('express');
var app = express();
var router = express.Router();
var path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://prostuff.net:27017/pubdb", {native_parser: true});
var dbdev = mongo.db("mongodb://prostuff.net:27017/pubdb-dev", {native_parser: true});


// Make our db accessible for cross domain queries
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    req.db = db;
    req.dbdev = dbdev;
    next();
})


router.get('/authors', function (req, res) {
    var name = req.query.name;
    var format = req.query.format;
    var year = req.query.year;
    var dev = req.query.dev;

    var query = {};
    var options = {};
    var pubCount = 0;
    var iterate = false;

    if (typeof dev !== 'undefined' && dev !== null) {
        var db = req.dbdev;
    } else {
        var db = req.db;
    }

    if (typeof name !== 'undefined' && name !== null) {
        query._id = name;
    }
    if (typeof format !== 'undefined' && format !== null) {
        if (format == 'compact') {
            options._id = 1;
            options.publishedWith = 1;
            options.count = 1;
        } else if (format == 'names') {
            options._id = 1;

        } else if (format == 'count') {
            if (typeof year == 'undefined' && year == null && typeof name == 'undefined' && name == null) {
                // no year and name specified
                console.log("no Year and name");
                options._id = 1;
                options.count = 1;
            } else if (typeof year !== 'undefined' && year !== null && typeof name !== 'undefined' && name !== null) {
                // year and name specified
                console.log("year and name specified");
                options._id = 1;
                options.count = 1;
                var countQuery = {authors: name, year: parseInt(year)};

                db.collection('publications').count(countQuery, function (err, count) {
                    pubCount = count;
                });

            } else if (typeof year !== 'undefined' && year !== null && typeof name == 'undefined' && name == null) {
                // year specified but no name

                //console.log("year specified but no name!");
                options._id = 1;
                options.count = 1;

            } else {
                // name but no year specified
                //console.log("name but no year specified");
                options._id = 1;
                options.count = 1;
            }
        }
    }


    db.collection('authors').find(query, options).toArray(function (err, items) {
        if (typeof year !== 'undefined' && year !== null && items.length > 0) {
            items[0].count = pubCount;
        }
        res.json(items);
    });
});


router.get('/', function (req, res) {
    var renderingParameters = {
        title: 'PubDB API'

    };
    res.render('index', renderingParameters);

});

router.get('/search', function (req, res) {
    var title = req.query.title;
    var authors = req.query.author;
    var year = req.query.year;
    var month = req.query.month;
    var type = req.query.type;
    var keywords = req.query.keywords;
    var award = req.query.award;
    var count = req.query.count;
    var www = req.query.www;
    var dev = req.query.dev;


    var query = {};
    var options = {};
    if (typeof dev !== 'undefined' && dev !== null) {
        var db = req.dbdev;
    } else {
        var db = req.db;
    }

    if (typeof title !== 'undefined' && title !== null) {
        if ((title.toString()).split(",").length == 1) {
            query.title = new RegExp(title, 'i');
        } else {
            // multiple values
            var subquery = "";
            title.toString().split(",").forEach(function (item) {
                subquery += '.*?' + item;
            });
            query.title = new RegExp(subquery, 'i');
        }


    }

    if (typeof authors !== 'undefined' && authors !== null) {

        if ((authors.toString()).split(",").length == 1) {
            query.authors = authors;
        } else {
            // multiple authors
            var subquery = [];
            authors.toString().split(",").forEach(function (item) {
                subquery.push(item);
            });
            query.authors = {$all: subquery}
        }
    }


    if (typeof year !== 'undefined' && year !== null) {

        if ((year.toString()).split(",").length == 1) {
            if ((year.toString()).split("-").length == 1) {
                // only one value specified
                query.year = parseInt(year);
            } else {
                // range specified
                var lowVal = Math.min((year.toString()).split("-")[0], (year.toString()).split("-")[1]);
                var highVal = Math.max((year.toString()).split("-")[0], (year.toString()).split("-")[1]);
                var subquery = [];
                for (var i = lowVal; i <= highVal; i++) {
                    subquery.push(parseInt(i));
                }
                query.year = {$in: subquery};
            }
        } else {
            // multiple values
            var subquery = [];
            year.toString().split(",").forEach(function (item) {
                subquery.push(parseInt(item));
            });
            query.year = {$in: subquery}
        }


    }
    if (typeof month !== 'undefined' && month !== null) {
        if ((month.toString()).split(",").length == 1) {
            if ((month.toString()).split("-").length == 1) {
                // only one value specified
                query.month = parseInt(month);
            } else {
                // range specified
                var lowVal = Math.min((month.toString()).split("-")[0], (month.toString()).split("-")[1]);
                var highVal = Math.max((month.toString()).split("-")[0], (month.toString()).split("-")[1]);
                var subquery = [];
                for (var i = lowVal; i <= highVal; i++) {
                    subquery.push(parseInt(i));
                }
                query.month = {$in: subquery};
            }
        } else {
            // multiple values
            var subquery = [];
            month.toString().split(",").forEach(function (item) {
                subquery.push(parseInt(item));
            });
            query.month = {$in: subquery}
        }
    }
    if (typeof type !== 'undefined' && type !== null) {
        if ((type.toString()).split(",").length == 1) {
            query.type = type;
        } else {
            // multiple type
            var subquery = [];
            type.toString().split(",").forEach(function (item) {
                subquery.push(item);
            });
            query.type = {$in: subquery}
            console.log("multiple " + query.type + ' & ' + subquery);
        }


    }
    if (typeof keywords !== 'undefined' && keywords !== null) {
        if ((keywords.toString()).split(",").length == 1) {
            query.keywords = keywords;
        } else {
            // multiple keywords
            var subquery = [];
            keywords.toString().split(",").forEach(function (item) {
                subquery.push(item);
            });
            query.keywords = {$all: subquery}
        }
    }
    if (typeof award !== 'undefined' && award !== null) {
        if (award == 'any') {
            query.awards = {"$exists": "true"};
        } else {
            query.awards = award;
        }
    }


    if (count == 'true') {
        // count query

        db.collection('publications').count(query, function (err, count) {
            console.log(count);
            console.log(query);
            response = {
                count: count
            }
            res.json(response);
        });


    } else {
        // normal find query
        db.collection('publications').find(query, options).toArray(function (err, items) {
            res.json(items);
        });
    }


});

router.get('/api', function (req, res) {
    var renderingParameters = {
        title: 'PubDB API'

    };
    res.render('index', renderingParameters);
});

app.use(router);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('PubDB API up and running at http://%s:%s',
        host, port)
});
module.exports = router;
module.exports = app;
