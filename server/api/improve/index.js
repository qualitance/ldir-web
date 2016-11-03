'use strict';

var express = require('express');
var controller = require('./improve.controller');

var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.find);
router.post('/', auth.isAuthenticated(), controller.create);

module.exports = router;