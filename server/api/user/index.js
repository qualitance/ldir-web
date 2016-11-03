'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

//======================================================================== ROLE ADMIN
router.get('/', auth.hasRole('admin'), controller.query_users);
router.put('/', auth.hasRole('admin'), controller.edit_user);
router.delete('/', auth.hasRole('admin'), controller.delete_user);
router.post('/create_supervisor', auth.hasRole('admin'), controller.create_supervisor); //create user from an admin account
router.get('/statistics', auth.hasRole('admin'), controller.getStatisticsAll);

//========================================================================= ROLE USER
router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/me', auth.isAuthenticated(), controller.update);
router.delete('/me', auth.isAuthenticated(), controller.destroy);
router.get('/stats', auth.isAuthenticated(), controller.getUserStatistics);
router.put('/password', auth.isAuthenticated(), controller.changePasswordbyAuth); // change own password
router.post('/subscribeDevice', auth.isAuthenticated(), controller.subscribeDevice); // subscribe mobile device for push notifications
router.post('/unsubscribeDevice', auth.isAuthenticated(), controller.unsubscribeDevice); // subscribe mobile device for push notifications

//============================================================================ PUBLIC
router.post('/', controller.create);
router.get('/activate/:token', controller.activate);
router.post('/resendActivation', controller.resendActivation);
router.post('/fpw', controller.fpw);
router.get("/reset/:token", controller.reset);
router.put("/reset/:token", controller.changePasswordByToken); // change password based on salt
router.get('/set_password/:token', controller.findUserByToken); //identify user (created by an admin) by token
router.post('/set_password', controller.setPassByToken); //set password for user created by an admin

module.exports = router;
