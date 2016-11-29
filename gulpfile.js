var gulp = require('gulp');
var argv = require('yargs').argv;
var concat = require('gulp-concat');
var async = require('async');
var Q = require('q');
var fs = require('fs');

var MongoClient = require('mongodb').MongoClient;
var _OID = require('mongodb').ObjectId;
var url = 'mongodb://localhost:27017/ldrweb';
var tempDir = './temp';
var DAFile = tempDir + '/DA.txt';

var db;

function connectToDb(callback) {
    MongoClient.connect(url, function (err, database) {
        if (err) {
            console.log(err);
        } else {
            db = database;
            callback();
        }
    });
}

function handleDbError(err) {
    console.log(err);
    doneDbOperation();
}

function doneDbOperation() {
    console.log('Closing db...');
    db.close();
}

function prepareWorkspace() {
    var dir = tempDir;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function clearDA() {
    prepareWorkspace();
    fs.writeFileSync(DAFile, '');
}

function writeToDA(authority, new_authority) {
    var line = authority.city + '/' + authority.county + '->' + new_authority.city + '/' + new_authority.county;
    //console.log(line);
    fs.appendFileSync(DAFile, line + '\n');
}

function readFromDA() {
    return fs.readFileSync(DAFile).toString();
}

gulp.task('check', function () {
    console.log('gulp ok');
    connectToDb(function () {
        console.log('database ok');
        doneDbOperation();
    });
});

gulp.task('findDamagedAuthorities', function () {
    clearDA();
    connectToDb(function () {
        if (argv.allocated == 1) {
            db.collection('piles').distinct('allocated.authority', {allocated: {$exists: true}}, function (err, authoritiesIds) {
                if (err) {
                    handleDbError(err);
                } else {
                    console.log(authoritiesIds.length + ' filtered authorities');
                    findDamagedAuthorities(authoritiesIds);
                }
            });
        } else {
            findDamagedAuthorities();
        }
    });
});

gulp.task('ngdocs', [], function () {
    var gulpDocs = require('gulp-ngdocs');

    var options = {
        scripts: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular.min.js',
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular-animate.min.js'
        ]
    };

    return gulp.src(['server/api/activity/*.js'])
        .pipe(gulpDocs.process(options))
        .pipe(gulp.dest('./docs'));
});
gulp.task('connect_ngdocs', function() {
    var connect = require('gulp-connect');
    connect.server({
        root: 'docs',
        livereload: false,
        fallback: 'docs/index.html',
        port: 8083
    });
});

function findDamagedAuthorities(filterIds) {
    var query = {fax: new RegExp('rofax', 'i')};
    if (filterIds) query['_id'] = {$in: filterIds};
    getDocuments('authorities', query).then(
        function (authorities) {
            async.eachSeries(authorities, checkAuthorityValid, function (err) {
                if (err) {
                    handleDbError(err);
                } else {
                    doneDbOperation();
                }
            })
        },
        function (err) {
            handleDbError(err);
        }
    );
}

function checkAuthorityValid(authority, callback) {
    getDocument('authorities_new', {fax: authority.fax}).then(
        function (new_authority) {
            if (!new_authority) console.log(authority.fax);
            if (isInvalid(authority, new_authority)) {
                handleWrongAuthorities(authority, [new_authority], callback);
            } else {
                callback();
            }
        },
        function (err) {
            if (err.code === 1) {
                var shouldBeJustOne = [];
                for (var i = 0; i < err.result.length; i++) {
                    if (isInvalid(authority, err.result[i])) shouldBeJustOne.push(err.result[i]);
                }
                if (shouldBeJustOne.length === 1) {
                    handleWrongAuthorities(authority, shouldBeJustOne, callback);
                } else {
                    console.log(shouldBeJustOne);
                }
            } else {
                callback(err);
            }
        }
    );
}

function isInvalid(authority, new_authority) {
    return (authority.city.toString() !== new_authority.city.toString())
        ||
        (authority.county.toString() !== new_authority.county.toString())
}

function handleWrongAuthorities(authority, new_authorities, cbWrongAuthorities) {
    async.eachSeries(new_authorities, function handleWrongAuthority(new_authority, cbWrongAuthority) {
        writeToDA(authority, new_authority);
        cbWrongAuthority();
    }, function (err) {
        cbWrongAuthorities(err);
    })
}

gulp.task('interpretAuthoritiesStats', function () {
    var stats = readFromDA().split('\n');
    connectToDb(function () {
        async.eachSeries(stats, function interpretStat(stat, callback) {
            if (!stat) {
                callback();
            } else {
                var s = stat.split(/\/|\>|\-/g);
                s.splice(2, 1);
                Q.all([
                    getDocument('authorities', {
                        city: ObjectId(s[0]),
                        county: ObjectId(s[1]),
                        fax: new RegExp('rofax', 'i')
                    }),
                    getDocument('authorities_new', {
                        city: ObjectId(s[2]),
                        county: ObjectId(s[3]),
                        fax: new RegExp('rofax', 'i')
                    })
                ]).then(
                    function (results) {
                        var previousAuthority = results[0];
                        var actualAuthority = results[1];
                        Q.all([
                            getDocument('counties', {_id: ObjectId(previousAuthority.county)}),
                            getDocument('counties', {_id: ObjectId(actualAuthority.county)}),
                            getDocument('cities', {_id: ObjectId(previousAuthority.city)}),
                            getDocument('cities', {_id: ObjectId(actualAuthority.city)})
                        ]).then(
                            function (results) {
                                var previousAuthorityCounty = results[0];
                                var actualAuthorityCounty = results[1];
                                var previousAuthorityCity = results[2];
                                var actualAuthorityCity = results[3];
                                db.collection('piles').distinct('nr_ord', {'allocated.authority': previousAuthority._id}, function (err, pileNrOrds) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log('================');
                                        console.log('Piles affected: ' + pileNrOrds);
                                        console.log('Authority ' + previousAuthorityCounty.name + ', ' + previousAuthorityCity.name + ' should have been ' + actualAuthorityCounty.name + ', ' + actualAuthorityCity.name);
                                        callback();
                                    }
                                });
                            },
                            function (err) {
                                callback(err);
                            }
                        );
                    },
                    function (err) {
                        callback(err);
                    }
                )
            }
        }, function doneInterpretingStat(err) {
            if (err) {
                handleDbError(err);
            } else {
                console.log('SUCCESS');
                doneDbOperation();
            }
        });
    });
});

gulp.task('fixAllocated', function () {
    connectToDb(function () {
        Q.all([
            fixAllocatedRofax(),
            fixAllocatedLDIR()
        ]).then(
            function () {
                doneDbOperation();
            },
            function (err) {
                handleDbError(err);
            }
        );
    });
});

function fixAllocatedRofax() {
    var deferred = Q.defer();
    getDocuments('piles', {allocated: {$exists: true}}, function (err, piles) {
        if (err) {
            deferred.reject(err);
        } else {
            async.eachSeries(piles, function (pile, callback) {
                getDocument('authorities', {_id: pile.allocated.authority, fax: new RegExp('rofax', 'i')}).then(
                    function (authority) {
                        if (!authority) {
                            callback();
                        } else {
                            getDocument('authorities_new', {fax: authority.fax}, function (err, new_authority) {
                                if (err && err.code !== 1) {
                                    callback(err);
                                } else if (!new_authority && !err.code === 1) {
                                    callback('No authority');
                                } else {
                                    var chosenFromMultiple;
                                    if (err.code === 1) {
                                        for (var i = 0; i < err.result.length; i++) {
                                            if (err.result[i].city.toString() === authority.city.toString()) chosenFromMultiple = err.result[i];
                                        }
                                    } else {
                                        chosenFromMultiple = new_authority;
                                    }
                                    if (chosenFromMultiple) {
                                        db.collection('piles').update(
                                            {_id: pile._id},
                                            {$set: {'allocated.authority': chosenFromMultiple._id}},
                                            function (err, result) {
                                                callback(err);
                                            }
                                        );
                                    } else {
                                        callback('Could not resolve authority');
                                    }
                                }
                            });
                        }
                    },
                    function (err) {
                        callback(err);
                    }
                );
            }, function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            })
        }
    });
    return deferred.promise;
}

function fixAllocatedLDIR() {
    var deferred = Q.defer();
    getDocuments('piles', {allocated: {$exists: true}}, function (err, piles) {
        if (err) {
            deferred.reject(err);
        } else {
            async.eachSeries(piles, function (pile, callback) {
                getDocument('authorities', {
                    _id: pile.allocated.authority,
                    fax: new RegExp('letsdoitromania', 'i')
                }).then(
                    function (authority) {
                        if (!authority) {
                            callback();
                        } else {
                            getDocument('authorities_new', {
                                city: authority.city,
                                county: authority.county,
                                fax: new RegExp('letsdoitromania', 'i')
                            }).then(
                                function (new_authority) {
                                    if (!new_authority) {
                                        callback('No authority');
                                    } else {
                                        db.collection('piles').update(
                                            {_id: pile._id},
                                            {$set: {'allocated.authority': new_authority._id}},
                                            function (err, result) {
                                                callback(err);
                                            }
                                        );
                                    }
                                },
                                function (err) {
                                    callback(err);
                                }
                            );
                        }
                    },
                    function (err) {
                        callback(err);
                    }
                );
            }, function (err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            })
        }
    });
    return deferred.promise;
}

function checkPileAllocation(pile, callback) {
    if (pile.allocated.authority) {
        getDocument('authorities', {_id: ObjectId(pile.allocated.authority)}).then(
            function (authority) {
                if (!authority) {
                    callback();
                } else if (authority.city.toString() !== pile.city.toString()) {
                    handleWrongAllocated(pile, authority).then(
                        function () {
                            callback();
                        },
                        function (err) {
                            callback(err);
                        }
                    );
                } else {
                    callback();
                }
            },
            function (err) {
                callback(err);
            }
        )
    } else {
        callback();
    }
}

function handleWrongAllocated(pile, authority) {
    var deferred = Q.defer();
    console.log('wa');
    deferred.resolve();
    return deferred.promise;
}

function ObjectId(str) {
    return _OID(str.toString());
}

function getDocuments(collection, query, callback) {
    var deferred = Q.defer();
    query = query || {};
    db.collection(collection).find(query).toArray(function (err, docs) {
        if (typeof callback === 'function') {
            callback(err, docs);
        } else {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(docs);
            }
        }
    });
    return deferred.promise;
}

function getDocument(collection, query, callback) {
    var deferred = Q.defer();
    getDocuments(collection, query).then(
        function (docs) {
            if (docs.length <= 1) {
                if (typeof callback === 'function') {
                    callback(false, docs[0] || null);
                } else {
                    deferred.resolve(docs[0] || null);
                }
            } else {
                var err = {
                    err: 'getDocument - multiple matches',
                    code: 1,
                    collection: collection,
                    query: JSON.stringify(query),
                    result: docs
                };
                if (typeof callback === 'function') {
                    callback(err);
                } else {
                    deferred.reject(err);
                }
            }
        },
        function (err) {
            if (typeof callback === 'function') {
                callback(err);
            } else {
                deferred.reject(err);
            }
        }
    );
    return deferred.promise;
}
