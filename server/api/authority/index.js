'use strict';

var express = require('express');
var controller = require('./authority.controller');

var router = express.Router();

var auth = require('../../auth/auth.service');

router.get('/', auth.hasRole('supervisor'), controller.find);

module.exports = router;