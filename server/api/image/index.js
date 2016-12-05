'use strict';

var express = require('express');
var controller = require('./image.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

//router.get('/', controller.index);
//router.get('/:id', controller.show);
router.post('/', auth.isAuthenticated(), controller.create);
//router.put('/:id', controller.update);
//router.patch('/:id', controller.update);
router.delete('/', auth.isAuthenticated(), controller.destroy);

module.exports = router;