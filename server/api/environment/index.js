'use strict';

var express = require('express');
var controller = require('./environment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /environment:
 *   get:
 *     responses:
 *       200:
 *         description: environment variables object
 */
router.get('/', controller.find);

module.exports = router;
