var env = require('../../config/environment');
var mailer = require('../../components/mailer');

/**
 * @name create
 * @function
 * @description sends mail with contact note
 * @param {Object} req
 * @param {Object} res
 */
exports.create = function (req, res) {
    mailer.send(
        'contact',
        {name: env.contact.name, email: env.contact.email},
        [{name: 'MESSAGE', content: req.body.message}],
        ['contact'],
        {name: req.body.first_name + ' ' + req.body.last_name, email: req.body.email},
        {subject: 'Contact form'}
    ).then(
        function () {
            res.handleResponse(200, {}, 'contact_1');
        },
        function (err) {
            console.log(err);
            res.handleResponse(500, {}, 'contact_2');
        }
    );
};
