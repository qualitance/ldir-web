'use strict';

var express = require('express');
var controller = require('./contact.controller');
var router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     responses:
 *       200:
 *         description: mail successfully sent
 *       500:
 *         description: server error
 */
router.post('/', controller.create);

module.exports = router;
