'use strict';

var express = require('express');
var controller = require('./state_authority.controller');

var router = express.Router();

/**
 * @swagger
 * /state_authorities:
 *   get:
 *     responses:
 *       200:
 *         description: get all state authorities
 */
router.get('/', controller.index);
/**
 * @swagger
 * /state_authorities/:id:
 *   get:
 *     responses:
 *       state_authority:
 *         description: state_authority requested object
 *       404:
 *         description: server error
 */
router.get('/:id', controller.show);
/**
 * @swagger
 * /state_authorities:
 *   post:
 *     responses:
 *       201:
 *         description: state_authority successfully created
 *       err:
 *         description: error object
 */
router.post('/', controller.create);
/**
 * @swagger
 * /state_authorities/:id:
 *   put:
 *     responses:
 *       200:
 *         description: updated statistics object
 *       404:
 *         description: requested state_authorities not found
 */
router.put('/:id', controller.update);
/**
 * @swagger
 * /state_authorities/:id:
 *   patch:
 *     responses:
 *       200:
 *         description: updated statistics object
 *       404:
 *         description: requested state_authorities not found
 */
router.patch('/:id', controller.update);
/**
 * @swagger
 * /state_authorities/:id:
 *   delete:
 *     responses:
 *       204:
 *         description: state_authority successfully deleted
 *       404:
 *         description: state_authority to delete not found
 */
router.delete('/:id', controller.destroy);

module.exports = router;
