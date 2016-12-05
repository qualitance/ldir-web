'use strict';

var express = require('express');
var controller = require('./pile.controller');
var auth = require('../../auth/auth.service');
var geoJsonMiddleWare = require('../../components/geoJsonMiddleware/geoJsonMiddleware.js');

var PileService = require('./pile.service');

var router = express.Router();


router.get('/', auth.isAuthenticated(), controller.find);
router.get('/map', auth.isAuthenticated(), controller.findOnMap);
router.post('/', auth.isAuthenticated(), PileService.parseFormData, geoJsonMiddleWare, controller.create);
router.put('/', auth.hasRole('supervisor'), controller.update);
router.put('/hide', auth.hasRole('admin'), controller.hide);
router.put('/updateLocation', auth.hasRole('supervisor'), geoJsonMiddleWare, controller.updateLocation);
router.post('/allocate', auth.hasRole('supervisor'), controller.allocate);
router.post('/pileConfirmation', auth.isAuthenticated(), controller.pileConfirmation);
router.post('/statistics', auth.hasRole('admin'), controller.getStatistics);
//router.patch('/:id', auth.isAuthenticated(), controller.update);
//router.delete('/:id', auth.isAuthenticated(), auth.hasRole('supervisor'), controller.destroy);

module.exports = router;
