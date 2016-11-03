'use strict';

var Countries = require('./country.model');

// Gets a list of Countrys
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
