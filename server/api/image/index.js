'use strict';

var express = require('express');
var controller = require('./image.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.delete('/', auth.isAuthenticated(), controller.destroy);

module.exports = router;
