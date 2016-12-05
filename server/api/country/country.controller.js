/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/countries              ->  index
 */

'use strict';

var Countries = require('./country.model')

/**
 * Get a list of countries
 * @param req
 * @param res
 */
function index(req, res) {
  Countries.find({}, function (err, countries) {
    if(err){
      console.log(err)
      res.send(500)
    }else{
      res.send(countries)
    }
  });
}

module.exports = {
  index: index
}
