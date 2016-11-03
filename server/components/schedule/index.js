'use strict';

var schedule = require('node-schedule');

var PileService = require('../../api/pile/pile.service');

var pileDueDate = schedule.scheduleJob('0 0 * * *', function () {
    PileService.notifyDueDatePassed().then(
        function (success) {

        },
        function (err) {
        }
    );
});

pileDueDate.schedule();
