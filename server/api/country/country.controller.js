'use strict';

var Countries = require('./country.model');

/**
 * @name index
 * @function
 * @description gets all countries
 * @param {Object} req
 * @param {Object} res
 */
function index(req, res) {
    Countries.find({}, function (err, countries) {
        if (err) {
            res.send(500)
        } else {
            res.send(countries)
        }
    });
}

module.exports = {
    index: index
};
