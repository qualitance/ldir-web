var env = require('../../../config/environment');

var Authority = require('../../../api/authority/authority.model.js');
var City = require('../../../api/city/city.model.js');
var County = require('../../../api/county/county.model.js');

var async = require('async');
var excelParser = require('excel-parser');
var Q = require('q');

var Utils = require('../../../components/utils');

var excelInput = './server/config/seed/authorities/primarii_formatat2.xlsx';

var headers = ['UAT', 'fax'];

var populateAuthorities = function (fromFile, collectionName) {
    if (fromFile) {
        populateFromFile();
    } else {
        populateFromDump(collectionName);
    }
};

function populateFromDump(collectionName) {
    var db = env.mongo.uri.split('/').pop();
    var workdirAbs;
    Utils.spawnCommand('pwd', []).then(
        function (success) {
            console.log(success);
        },
        function (err) {
            console.log(err);
        },
        function (data) {
            if (data) {
                workdirAbs = data.toString().replace(/\n/g, '') + '/server/config/seed/authorities/fixed';
                var dumpFile = workdirAbs + '/authorities.bson';
                console.log('authorities dump dir:', workdirAbs);
                Utils.spawnCommand('mongorestore', ['-h', 'localhost:27017', '-d', db, '-c', collectionName, '--drop', '--dir=' + dumpFile]).then(
                    function (success) {
                        console.log(success);
                    },
                    function (err) {
                        console.log(err);
                    },
                    function (data) {
                        if (data) {
                            console.log(data.toString());
                        }
                    }
                )
            }
        }
    );
}

function populateFromFile() {
    excelParser.worksheets({
        inFile: excelInput
    }, function (err, worksheets) {
        if (err) {
            console.error(err);
        } else {
            async.eachSeries(worksheets, parseWorksheet, function (err) {
                if (err) {
                    console.log('At parseWorksheet callback');
                    console.log(err);
                } else {
                    console.log('Finished importing authorities');
                    insertDummyData().then(
                        function () {
                            console.log('Finished inserting dummy authorities');
                        },
                        function (err) {
                            console.log(err);
                        }
                    );
                }
            });
        }
    });
}

function insertDummyData() {
    var deferred = Q.defer();
    City.find({}, function (err, cities) {
        if (err) {
            deferred.reject(err);
        } else {
            async.each(cities, function (city, callback) {
                Authority.create({
                    name: 'Let\'s Do It',
                    city: city._id,
                    county: city.county,
                    fax: env.authorities.default_to,
                    isDummy: true
                }, function (err) {
                    callback(err);
                });
            }, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Inserted dummy authorities');
                }
            });
        }
    });
    return deferred.promise;
}

var sanitizeEntry = function (entry) {
    return entry.trim().replace(/ /g, '').replace(/;/g, '').replace(/,/g, '');
};

var insertAuthorities = function (insertStack) {
    var deferred = Q.defer();
    Authority.create(insertStack, function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
};

var parseWorksheet = function (worksheet, callbackWorksheet) {
    var insertStack = [];

    var countyName = Utils.latinLettersAndNumbersOnly(worksheet.name);
    County.findOne({plain_name: new RegExp('^' + countyName, 'i')}, function (err, county) {
        if (err) {
            callbackWorksheet(err);
        } else if (!county) {
            callbackWorksheet('Error finding county ' + countyName);
        } else {
            var county_id = county._id;
            excelParser.parse({
                inFile: excelInput,
                worksheet: worksheet.id,
                skipEmpty: false
            }, function (err, records) {
                if (err) {
                    callbackWorksheet(err);
                } else {
                    //remove the header
                    records = records.slice(1, records.length);
                    //insert records
                    async.eachSeries(records, function (record, cbRecord) {
                        //find city in db
                        var cityNameStripped = Utils.latinLettersAndNumbersOnly(record[0]);
                        City.findOne({
                            plain_name: new RegExp('^' + cityNameStripped + '$', 'i'),
                            county: county_id
                        }, function (err, city) {
                            if (err) {
                                cbRecord(err);
                            } else if (!city) {
                                console.log('=========================');
                                console.log('Error finding city in db:');
                                console.log({
                                    record: record,
                                    city_name: cityNameStripped,
                                    county: county.name,
                                    county_id: county._id
                                });
                                cbRecord();
                            } else {
                                if (record[1]) {
                                    insertStack.push({
                                        name: city.name,
                                        city: city._id,
                                        county: county._id,
                                        fax: sanitizeEntry(((process.env.NODE_ENV === 'production') || (process.env.NODE_ENV === 'sandbox')) ? record[1] : record[1].replace(/rofax/i, 'mailinator')),
                                        isDummy: false
                                    });
                                }
                                cbRecord();
                            }
                        });
                    }, function () {
                        insertAuthorities(insertStack).then(
                            function () {
                                callbackWorksheet();
                            },
                            function (err) {
                                callbackWorksheet(err);
                            }
                        );
                    });
                }
            });
        }
    });
};

exports.populateAuthorities = populateAuthorities;
