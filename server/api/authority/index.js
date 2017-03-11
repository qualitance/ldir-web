'use strict';

var express = require('express');
var controller = require('./authority.controller');

var router = express.Router();

var auth = require('../../auth/auth.service');

/**
 * @swagger
 * /authority:
 *   get:
 *     responses:
 *       200:
 *         description: authority required
 *       500:
 *         description: server error
 */
router.get('/', auth.hasRole('supervisor'), controller.find);

module.exports = router;
