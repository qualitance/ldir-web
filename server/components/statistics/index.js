'use strict';

var Q = require('q');
var request = require('request');

var env = require('../../config/environment');
var UtilsService = require('../utils');

var County = require('../../api/county/county.model');

/**
 * @name formatElasticQuery
 * @function
 * @description formats query for elastic search
 * @param {Object} county_id
 * @param {Object} date_start
 * @param {Object} date_end
 */
var formatElasticQuery = function (county_id, date_start, date_end) {
    var query = {
        filtered: {}
    };

    if (county_id) {
        query.filtered.query = {
            match: {
                county: county_id
            }
        };
    }

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

/**
 * @name getPileStats
 * @function
 * @description gets pile stats, form query object, form aggregation object, if report is not requested for specific county,
 * sub-aggregate for each county, place the query before the aggregations and finally, form the request payload
 * @param {Object} county_id
 * @param {Object} date_start
 * @param {Object} date_end
 */
var getPileStats = function (county_id, date_start, date_end) {

    var deferred = Q.defer();

    var query = formatElasticQuery(county_id, date_start, date_end);

    var aggregations = {
        status: {
            terms: {
                field: 'status'
            }
        },
        content: {
            terms: {
                field: 'content',
                size: 50
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

    if (!county_id) {
        aggregations.county = {
            terms: {
                field: 'county'
            },
            aggs: JSON.parse(JSON.stringify(aggregations))
        };
    }

    var data = {};
    if (query) {
        data.query = query;
    }
    data.aggs = aggregations;

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

/**
 * @name getUserStats
 * @function
 * @description gets user stats, form query object, form aggregation object, if report is not requested for specific county,
 * sub-aggregate for each county, place the query before the aggregations and finally, form the request payload
 * @param {Object} county_id
 * @param {Object} date_start
 * @param {Object} date_end
 */
var getUserStats = function (county_id, date_start, date_end) {

    var deferred = Q.defer();

    var query = formatElasticQuery(county_id, date_start, date_end);

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

    var data = {};
    if (query) {
        data.query = query;
    }
    data.aggs = aggregations;

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

/**
 * @name getPileStats
 * @function
 * @description format a readable client response from our elastic server response
 * @param {Object} county_id
 * @param {Object} date_start
 * @param {Object} date_end
 */
exports.getPileStats = function (county_id, date_start, date_end) {
    var deferred = Q.defer();
    if (county_id || (date_start && date_end)) {
        getPileStats(county_id, date_start, date_end).then(
            function (success) {
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

/**
 * @name getUserStats
 * @function
 * @description format a readable client response from our elastic server response
 * @param {Object} county_id
 * @param {Object} date_start
 * @param {Object} date_end
 */
exports.getUserStats = function (county_id, date_start, date_end) {
    var deferred = Q.defer();
    getUserStats(county_id, date_start, date_end).then(
        function (success) {
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
