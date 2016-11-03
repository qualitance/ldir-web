'use strict';

var Q = require('q');
var request = require('request');

var env = require('../../config/environment');
var UtilsService = require('../utils');

var County = require('../../api/county/county.model');

var formatElasticQuery = function (county_id, date_start, date_end) {
    var query = {
        filtered: {}
    };

    //filter by county id
    if (county_id) {
        query.filtered.query = {
            match: {
                county: county_id
            }
        };
    }

    //filter by date range
    var range_options = {};

    if (UtilsService.isDate(date_start)) {
        range_options.gt = date_start;
    }
    if (UtilsService.isDate(date_end)) {
        range_options.gt = date_end;
    }
    if (range_options !== {}) {
        query.filtered.filter = {
            bool: {
                must: [
                    {
                        range: {
                            created_at: range_options
                        }
                    }],
                must_not: [
                    {
                        term: {
                            is_hidden: true
                        }
                    }
                ]
            }
        };
    }

    if (query.filtered === {}) {
        query = null;
    }
    return query;
};

var getPileStats = function (county_id, date_start, date_end) {

    var deferred = Q.defer();

    //first filter piles that need to be aggregated by forming a query object
    var query = formatElasticQuery(county_id, date_start, date_end);

    //next, form the aggregations object
    var aggregations = {
        status: {
            terms: {
                field: 'status'
            }
        },
        content: {
            terms: {
                field: 'content',
                size: 50         // default value is 10
            }
        },
        size: {
            terms: {
                field: 'size'
            }
        },
        avg_size: {
            avg: {
                field: 'size'
            }
        }
    };

    //if report is not requested for a specific county, sub-aggregate for each county
    if (!county_id) {
        aggregations.county = {
            terms: {
                field: 'county'
            },
            aggs: JSON.parse(JSON.stringify(aggregations))
        };
    }

    //finally, form our request payload; it is important to place the query before the aggregations

    var data = {};
    if (query) {
        data.query = query;
    }
    data.aggs = aggregations;

    //send the request
    request({
        method: 'POST',
        uri: env.elasticHost + '/piles/pile/_search',
        json: true,
        body: data
    }, function (error, response, body) {
        if (error) {
            console.log(error);
            deferred.reject({data: error});
        } else {
            deferred.resolve(body);
        }
    });
    return deferred.promise;
};

var getUserStats = function (county_id, date_start, date_end) {

    var deferred = Q.defer();

    //first filter users that need to be aggregated by forming a query object
    var query = formatElasticQuery(county_id, date_start, date_end);

    //next, form the aggregations object
    var aggregations = {
        status: {
            terms: {
                field: 'status'
            }
        },
        role: {
            terms: {
                field: 'role'
            }
        },
        provider: {
            terms: {
                field: 'provider'
            }
        }
    };

    //finally, form our request payload; it is important to place the query before the aggregations

    var data = {};
    if (query) {
        data.query = query;
    }
    data.aggs = aggregations;

    //send the request
    request({
        method: 'POST',
        uri: env.elasticHost + '/users/user/_search',
        json: true,
        body: data
    }, function (error, response, body) {
        if (error) {
            console.log(error);
            deferred.reject({data: error});
        } else {
            deferred.resolve(body);
        }
    });
    return deferred.promise;
};

var parseBuckets = function (buckets) {
    var ret = {};
    try {
        for (var i = 0; i < buckets.length; i++) {
            ret[buckets[i].key] = buckets[i].doc_count;
        }
        return ret;
    } catch (ex) {
        return {};
    }
};

var parseCountyAgg = function (agg) {
    return {
        avg_size: agg.avg_size.value,
        status: parseBuckets(agg.status.buckets),
        content: parseBuckets(agg.content.buckets),
        size: parseBuckets(agg.size.buckets)
    }
};

var parsePileAggs = function (aggs, callback) {
    try {
        var ret = parseCountyAgg(aggs);
        if (aggs.county) {
            County.find({}, function (err, counties) {
                if (err) {
                    callback(err);
                } else {
                    var countyMap = {};
                    var defalcated = {};
                    var i;
                    for (i = 0; i < counties.length; i++) {
                        countyMap[counties[i]._id] = counties[i].name;
                    }
                    for (i = 0; i < aggs.county.buckets.length; i++) {
                        var c = aggs.county.buckets[i];
                        defalcated[countyMap[c.key]] = parseCountyAgg(c);
                    }
                    ret = {
                        total: ret,
                        defalcated: defalcated
                    };
                    callback(false, ret);
                }
            });
        } else {
            callback(false, ret);
        }
    } catch (ex) {
        callback(ex);
    }
};

exports.getPileStats = function (county_id, date_start, date_end) {
    var deferred = Q.defer();
    if (county_id || (date_start && date_end)) {
        getPileStats(county_id, date_start, date_end).then(
            function (success) {
                //format a readable client response from our elastic server response
                var total = success.hits.total;
                var aggs = success.aggregations;
                parsePileAggs(aggs, function (err, parsed) {
                    if (err) {
                        deferred.reject({data: err});
                    } else {
                        parsed.total = total;
                        deferred.resolve(parsed);
                    }
                });
            },
            function (error) {
                deferred.reject({
                    data: {
                        error: error.data.error,
                        status: error.data.status
                    }
                });
            }
        );
    } else {
        deferred.reject({
            data: {
                error: 'statistics_1',
                status: 400
            }
        });
    }
    return deferred.promise;
};

exports.getUserStats = function (county_id, date_start, date_end) {
    var deferred = Q.defer();
    getUserStats(county_id, date_start, date_end).then(
        function (success) {
            //format a readable client response from our elastic server response
            var ret = {};
            ret.total = success.hits.total;
            var aggs = success.aggregations;
            ret.status = parseBuckets(aggs.status.buckets);
            ret.role = parseBuckets(aggs.role.buckets);
            ret.provider = parseBuckets(aggs.provider.buckets);
            deferred.resolve(ret);
        },
        function (error) {
            deferred.reject({
                data: {
                    error: error.data.error,
                    status: error.data.status
                }
            });
        }
    );
    return deferred.promise;
};
