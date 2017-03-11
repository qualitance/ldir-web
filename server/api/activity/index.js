'use strict';

var express = require('express');
var controller = require('./activity.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /activity:
 *   get:
 *     responses:
 *       200:
 *         description: activities of the user that initiated the request
 *       400:
 *         description: user hasn't the required role
 */
router.get('/', auth.isAuthenticated(), controller.findAllMine);
/**
 * @swagger
 * /activity/viewed:
 *   post:
 *     responses:
 *       200:
 *         description: activity successfully marked as read
 *       400:
 *         description: query missing id
 */
router.post('/viewed', auth.isAuthenticated(), controller.markAsViewed);

module.exports = router;
