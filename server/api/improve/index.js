'use strict';

var express = require('express');
var controller = require('./improve.controller');

var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /improve:
 *   get:
 *     responses:
 *       200:
 *         description: mail successfully sent or improve note object returned
 *       400:
 *         description: invalid start/end date
 *       404:
 *         description: requested improve note not found
 */
router.get('/', auth.hasRole('admin'), controller.find);
/**
 * @swagger
 * /image:
 *   post:
 *     responses:
 *       201:
 *         description: improve note successfully created
 *       422:
 *         description: validation error
 *       500:
 *         description: server error
 */
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;
