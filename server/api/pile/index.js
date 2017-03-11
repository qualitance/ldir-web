'use strict';

var express = require('express');
var controller = require('./pile.controller');
var auth = require('../../auth/auth.service');
var geoJsonMiddleWare = require('../../components/geoJsonMiddleware/geoJsonMiddleware.js');

var PileService = require('./pile.service');

var router = express.Router();

/**
 * @swagger
 * /pile:
 *   get:
 *     responses:
 *       200:
 *         description: piles to show in dashboard object
 *       400:
 *         description: invalid sort/filter
 *       404:
 *         description: pile requested not found
 */
router.get('/', auth.isAuthenticated(), controller.find);
/**
 * @swagger
 * /pile/map:
 *   get:
 *     responses:
 *       200:
 *         description: piles to show on map object
 */
router.get('/map', auth.isAuthenticated(), controller.findOnMap);
/**
 * @swagger
 * /pile:
 *   post:
 *     responses:
 *       200:
 *         description: mail successfully sent or improve note object returned
 *       400:
 *         description: invalid start/end date
 *       404:
 *         description: requested improve note not found
 */
router.post('/', auth.isAuthenticated(), PileService.parseFormData, geoJsonMiddleWare, controller.create);
/**
 * @swagger
 * /pile:
 *   put:
 *     responses:
 *       201:
 *         description: pile successfully created
 *       400:
 *         description: file size limit exceeded/missing siruta code/pile size not in interval
 */
router.put('/', auth.hasRole('supervisor'), controller.update);
/**
 * @swagger
 * /pile/hide:
 *   put:
 *     responses:
 *       200:
 *         description: pile successfully hidden
 *       404:
 *         description: pile to hide not found
 */
router.put('/hide', auth.hasRole('admin'), controller.hide);
/**
 * @swagger
 * /pile/updateLocation:
 *   put:
 *     responses:
 *       200:
 *         description: mail successfully sent or improve note object returned
 *       400:
 *         description: missing siruta code
 *       404:
 *         description: pile to update not found
 */
router.put('/updateLocation', auth.hasRole('supervisor'), geoJsonMiddleWare, controller.updateLocation);
/**
 * @swagger
 * /pile/allocate:
 *   put:
 *     responses:
 *       200:
 *         description: pile successfully allocated
 *       400:
 *         description: missing params/error parsing due date/due date not in range: due_date
 *       403:
 *         description: could not validate authority
 *       404:
 *         description: pile not found
 */
router.post('/allocate', auth.hasRole('supervisor'), controller.allocate);
/**
 * @swagger
 * /pile/pileConfirmation:
 *   put:
 *     responses:
 *       200:
 *         description: pile successfully confirmed/unconfirmed
 *       400:
 *         description: invalid params
 *       404:
 *         description: pile not found
 */
router.post('/pileConfirmation', auth.isAuthenticated(), controller.pileConfirmation);
/**
 * @swagger
 * /pile/statistics:
 *   put:
 *     responses:
 *       200:
 *         description: statistics object
 *       500:
 *         description: server error
 */
router.post('/statistics', auth.hasRole('admin'), controller.getStatistics);

module.exports = router;
