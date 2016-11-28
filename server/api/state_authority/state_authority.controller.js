'use strict';

var _ = require('lodash');
var StateAuthority = require('./state_authority.model');

/**
 * @name index
 * @function
 * @description gets list of all authorities
 * @param {Object} req
 * @param {Object} res
 */
exports.index = function (req, res) {
    StateAuthority.find(function (err, state_authoritys) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(200, state_authoritys);
    });
};

/**
 * @name show
 * @function
 * @description gets single authority
 * @param {Object} req
 * @param {Object} res
 */
exports.show = function (req, res) {
    StateAuthority.findById(req.params.id, function (err, state_authority) {
        if (err) {
            return handleError(res, err);
        }
        if (!state_authority) {
            return res.send(404);
        }
        return res.json(state_authority);
    });
};

/**
 * @name create
 * @function
 * @description creates new authority
 * @param {Object} req
 * @param {Object} res
 */
exports.create = function (req, res) {
    StateAuthority.create(req.body, function (err, state_authority) {
        if (err) {
            return handleError(res, err);
        }
        return res.json(201, state_authority);
    });
};

/**
 * @name update
 * @function
 * @description updates requested authority
 * @param {Object} req
 * @param {Object} res
 */
exports.update = function (req, res) {
    if (req.body._id) {
        delete req.body._id;
    }
    StateAuthority.findById(req.params.id, function (err, state_authority) {
        if (err) {
            return handleError(res, err);
        }
        if (!state_authority) {
            return res.send(404);
        }
        var updated = _.merge(state_authority, req.body);
        updated.save(function (err) {
            if (err) {
                return handleError(res, err);
            }
            return res.json(200, state_authority);
        });
    });
};

/**
 * @name destroy
 * @function
 * @description removes specified authority
 * @param {Object} req
 * @param {Object} res
 */
exports.destroy = function (req, res) {
    StateAuthority.findById(req.params.id, function (err, state_authority) {
        if (err) {
            return handleError(res, err);
        }
        if (!state_authority) {
            return res.send(404);
        }
        state_authority.remove(function (err) {
            if (err) {
                return handleError(res, err);
            }
            return res.send(204);
        });
    });
};

function handleError(res, err) {
    return res.send(500, err);
}
