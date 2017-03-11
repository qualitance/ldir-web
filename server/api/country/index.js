'use strict';

var express = require('express');
var controller = require('./country.controller');

var router = express.Router();

/**
 * @swagger
 * /country:
 *   get:
 *     responses:
 *       200:
 *         description: countries object
 *       500:
 *         description: server error
 */
router.get('/', controller.index);

module.exports = router;
