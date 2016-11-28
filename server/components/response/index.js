var defaultCode = 0;
var defaultStatus = 200;
var config = require('../../config/environment');
var raven = require('raven');
var client = new raven.Client(config.sentryUrl);
/**
 * Middleware that handles the response
 */
module.exports = function (req, res, next) {
    /**
     * @name handleResponse
     * @function
     * @param {number} status - Status code for response.
     * @param {object} data - Additional data sent in response.
     * @param {String} code - The code for corresponding message
     * @example
     * res.handleResponse(200, {}, "user_1");
     */
    res.handleResponse = function (status, data, code) {
        if (!!data && data.error) {
            client.setExtraContext({status: status, data: data, code: code});
            client.captureException(data.error);
        }
        res.send(status || defaultStatus, {
            data: data || {},
            code: code || defaultCode
        })
    };
    next()
};
