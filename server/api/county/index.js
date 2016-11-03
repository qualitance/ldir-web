'use strict';

var express = require('express');
var controller = require('./county.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/:id', controller.show);

module.exports = router;