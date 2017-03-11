'use strict';

var express = require('express');
var controller = require('./comment.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /comments:
 *   get:
 *     responses:
 *       200:
 *         description: comments associated to pile
 *       400:
 *         description: query missing pile object
 *       500:
 *         description: server error
 */
router.get('/', auth.isAuthenticated(), controller.show);
/**
 * @swagger
 * /comments:
 *   post:
 *     responses:
 *       200:
 *         description: comment successfully created
 *       400:
 *         description: query missing pile object
 *       500:
 *         description: server error
 */
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;
