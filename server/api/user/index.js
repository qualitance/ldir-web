'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     responses:
 *       200:
 *         description: requested user/sorted users object
 *       404:
 *         description: requested user not found
 */
router.get('/', auth.hasRole('admin'), controller.query_users);
/**
 * @swagger
 * /users:
 *   put:
 *     responses:
 *       200:
 *         description: updated user object
 *       404:
 *         description: user not found
 *       403:
 *         description: user that initiated the requested doesn't have permissions
 */
router.put('/', auth.hasRole('admin'), controller.edit_user);
/**
 * @swagger
 * /users:
 *   delete:
 *     responses:
 *       200:
 *         description: user successfully removed
 */
router.delete('/', auth.hasRole('admin'), controller.delete_user);
/**
 * @swagger
 * /users/create_supervisor:
 *   delete:
 *     responses:
 *       200:
 *         description: user with supervisor role successfully created
 */
router.post('/create_supervisor', auth.hasRole('admin'), controller.create_supervisor);
/**
 * @swagger
 * /users/statistics:
 *   get:
 *     responses:
 *       200:
 *         description: all users statistics object
 *       500:
 *         description: server error
 */
router.get('/statistics', auth.hasRole('admin'), controller.getStatisticsAll);
/**
 * @swagger
 * /users/me:
 *   get:
 *     responses:
 *       200:
 *         description: get user that initiated the request
 *       401:
 *         description: invalid credentials
 */
router.get('/me', auth.isAuthenticated(), controller.me);
/**
 * @swagger
 * /users/me:
 *   put:
 *     responses:
 *       200:
 *         description: updated user object
 *       401:
 *         description: user to update not found
 */
router.put('/me', auth.isAuthenticated(), controller.update);
/**
 * @swagger
 * /users/me:
 *   delete:
 *     responses:
 *       204:
 *         description: user successfully deleted
 *       500:
 *         description: server error
 */
router.delete('/me', auth.isAuthenticated(), controller.destroy);
/**
 * @swagger
 * /users/stats:
 *   get:
 *     responses:
 *       200:
 *         description: user statistics
 */
router.get('/stats', auth.isAuthenticated(), controller.getUserStatistics);
/**
 * @swagger
 * /users/password:
 *   put:
 *     responses:
 *       200:
 *         description: password successfully changed
 *       400:
 *         description: new/old password missing
 *       403:
 *         description: invalid old password
 */
router.put('/password', auth.isAuthenticated(), controller.changePasswordbyAuth);
/**
 * @swagger
 * /users/subscribeDevice:
 *   post:
 *     responses:
 *       200:
 *         description: device successfully subscribed
 *       400:
 *         description: missing device type/token
 */
router.post('/subscribeDevice', auth.isAuthenticated(), controller.subscribeDevice);
/**
 * @swagger
 * /users/unsubscribeDevice:
 *   post:
 *     responses:
 *       200:
 *         description: device successfully subscribed
 *       400:
 *         description: missing device type/token
 */
router.post('/unsubscribeDevice', auth.isAuthenticated(), controller.unsubscribeDevice);
/**
 * @swagger
 * /users:
 *   post:
 *     responses:
 *       200:
 *         description: user created object
 *       400:
 *         description: missing email field
 */
router.post('/', controller.create);
/**
 * @swagger
 * /users/activate/:token:
 *   get:
 *     responses:
 *       200:
 *         description: active user object
 *       400:
 *         description: missing token
 *       403:
 *         description: user status different from pending
 *       404:
 *         description: missing user
 */
router.get('/activate/:token', controller.activate);
/**
 * @swagger
 * /users/resendActivation:
 *   post:
 *     responses:
 *       200:
 *         description: activation email successfully resent
 *       400:
 *         description: missing email
 */
router.post('/resendActivation', controller.resendActivation);
/**
 * @swagger
 * /users/fpw:
 *   post:
 *     responses:
 *       200:
 *         description: reset password email sent
 *       400:
 *         description: missing email
 *       403:
 *         description: inactive user
 *       404:
 *         description: user not found
 */
router.post('/fpw', controller.fpw);
/**
 * @swagger
 * /users/reset/:token:
 *   get:
 *     responses:
 *       200:
 *         description: user object
 *       400:
 *         description: missing token
 *       404:
 *         description: missing user
 */
router.get("/reset/:token", controller.reset);
/**
 * @swagger
 * /users/reset/:token:
 *   put:
 *     responses:
 *       200:
 *         description: password successfully changed
 *       400:
 *         description: missing token
 *       404:
 *         description: missing user
 */
router.put("/reset/:token", controller.changePasswordByToken);
/**
 * @swagger
 * /users/set_password/:token:
 *   get:
 *     responses:
 *       200:
 *         description: requested user object
 *       400:
 *         description: missing token
 *       403:
 *         description: not allowed
 *       404:
 *         description: missing user
 */
router.get('/set_password/:token', controller.findUserByToken);
/**
 * @swagger
 * /users/set_password:
 *   post:
 *     responses:
 *       200:
 *         description: password successfully saved on user
 *       400:
 *         description: missing token
 *       403:
 *         description: not allowed
 *       404:
 *         description: missing user
 */
router.post('/set_password', controller.setPassByToken);

module.exports = router;
