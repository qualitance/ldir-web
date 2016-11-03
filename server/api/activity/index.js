'use strict';

var express = require('express');
var controller = require('./activity.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.isAuthenticated(), controller.findAllMine);
router.post('/viewed', auth.isAuthenticated(), controller.markAsViewed);

module.exports = router;
