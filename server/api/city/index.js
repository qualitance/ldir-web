'use strict';

var express = require('express');
var controller = require('./city.controller');

var router = express.Router();

/**
 * @swagger
 * /city:
 *   get:
 *     responses:
 *       200:
 *         description: all cities object
 */
router.get('/', controller.index);
/**
 * @swagger
 * /city/:id/county/:countyId:
 *   get:
 *     responses:
 *       200:
 *         description: cities in specific county object
 */
router.get('/:id/county/:countyId', controller.index);
/**
 * @swagger
 * /city/:id:
 *   get:
 *     responses:
 *       200:
 *         description: specific city object
 *       404:
 *         description: city not found
 */
router.get('/:id', controller.show);

module.exports = router;
