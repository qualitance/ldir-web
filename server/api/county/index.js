'use strict';

var express = require('express');
var controller = require('./county.controller');

var router = express.Router();

/**
 * @swagger
 * /county:
 *   get:
 *     responses:
 *       200:
 *         description: counties by country object
 */
router.get('/', controller.index);
/**
 * @swagger
 * /county/:id:
 *   get:
 *     responses:
 *       200:
 *         description: requested county object
 *       404:
 *         description: requested county not found
 *       500:
 *         description: server error
 */
router.get('/:id', controller.show);

module.exports = router;
