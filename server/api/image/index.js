'use strict';

var express = require('express');
var controller = require('./image.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /image:
 *   post:
 *     responses:
 *       200:
 *         description: created image object
 *       400:
 *         description: file size exceeded or missing params
 */
router.post('/', auth.isAuthenticated(), controller.create);
/**
 * @swagger
 * /image:
 *   delete:
 *     responses:
 *       204:
 *         description: image successfully deleted
 *       403:
 *         description: forbidden - only users with supervisor role can delete images
 *       404:
 *         description: image to delete not found
 */
router.delete('/', auth.isAuthenticated(), controller.destroy);

module.exports = router;
