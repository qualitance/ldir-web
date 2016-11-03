var Q = require('q');
var spawn = require('child_process').spawn;

exports.discardFields = function (obj, fieldsArray) {
    fieldsArray = fieldsArray || [];
    for (var key in obj) {
        if (fieldsArray.indexOf(key) >= 0) {
            delete obj[key];
        }
    }
};
exports.allowFields = function (obj, fieldsArray) {
    fieldsArray = fieldsArray || [];
    for (var key in obj) {
        if (fieldsArray.indexOf(key) === -1) {
            delete obj[key];
        }
    }
};
exports.isDate = function (obj) {
    return obj && obj.constructor && obj.constructor.toString && obj.constructor.toString().indexOf('Date') > -1;
};
exports.isArray = function (obj) {
    return obj && obj.constructor && obj.constructor.toString && obj.constructor.toString().indexOf('Array') > -1;
};
exports.isEmptyObject = function (obj) {
    return Object.keys(obj).length === 0;
};
exports.formatDate = function (date, options) {
    options = options || {};
    var language = options.language || 'ro';
    var dateSeparator = options.dateSeparator || ' ';
    var timeSeparator = options.timeSeparator || ':';
    var includeTime = options.includeTime;
    var includeTimeOffset = options.includeTimeOffset;
    var months = {
        'ro': [
            'ianuarie', 'februarie', 'martie',
            'aprilie', 'mai', 'iunie', 'iulie',
            'august', 'septembrie', 'octombrie',
            'noiembrie', 'decembrie'
        ],
        'en': [
            'January', 'February', 'March',
            'April', 'May', 'June', 'July',
            'August', 'September', 'October',
            'November', 'December'
        ]
    };
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var milliseconds = date.getMilliseconds();
    var timeOffset = parseInt(date.getTimezoneOffset() / 60);

    var ret = day + dateSeparator + months[language][month] + dateSeparator + year;
    if (includeTime) {
        ret += dateSeparator + hours + timeSeparator + minutes + timeSeparator + seconds + '.' + milliseconds;
    }
    if (includeTimeOffset) {
        ret += dateSeparator + '(GMT' + timeOffset + ')';
    }
    return ret;
};
exports.datePlusDays = function (date, days) {
    var ret = new Date(date);
    ret.setDate(ret.getDate() + days);
    return ret;
};
exports.resetTimeInDate = function (date) {
    return date.setHours(0, 0, 0, 0);
};

exports.latinLettersOnly = function (str) {
    if (typeof str !== 'string') {
        str = '';
    }
    return str
        .replace(/Ă/g, 'A')
        .replace(/ă/g, 'a')
        .replace(/Â/g, 'A')
        .replace(/â/g, 'a')
        .replace(/Î/g, 'I')
        .replace(/î/g, 'i')
        .replace(/Ș/g, 'S')
        .replace(/ș/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 's')
        .replace(/Ț/g, 'T')
        .replace(/ț/g, 't')
        .replace(/Ţ/g, 'T')
        .replace(/ţ/g, 't')
        .replace(/[^a-zA-Z]/g, '');
};

exports.latinLettersAndNumbersOnly = function (str) {
    if (typeof str !== 'string') {
        str = '';
    }
    return str
        .replace(/Ă/g, 'A')
        .replace(/ă/g, 'a')
        .replace(/Â/g, 'A')
        .replace(/â/g, 'a')
        .replace(/Î/g, 'I')
        .replace(/î/g, 'i')
        .replace(/Ș/g, 'S')
        .replace(/ș/g, 's')
        .replace(/Ş/g, 'S')
        .replace(/ş/g, 's')
        .replace(/Ț/g, 'T')
        .replace(/ț/g, 't')
        .replace(/Ţ/g, 'T')
        .replace(/ţ/g, 't')
        .replace(/[^a-zA-Z0-9]/g, '');
};

exports.decToDms = function (input, latlng) {
    var v = input.toString().split('.');
    var pole = (latlng === 'lat' ? (parseInt(v[1]) < 0 ? 'S' : 'N') : (parseInt(v[1]) < 0) ? 'V' : 'E');

    var t = parseFloat('0.' + v[1]) * 3600;

    var o = {
        deg: v[0],
        min: Math.floor(t / 60)
    };
    o.sec = Math.round((t - (o.min * 60)) * 1000) / 1000;

    return pole + ' ' + o.deg + '\xB0 ' + o.min + '\u2032 ' + o.sec + '\u2033';

};

exports.spawnCommand = function (command, args) {
    var deferred = Q.defer();
    var cmd = spawn(command, args);
    cmd.stdout.on('data', function (data) {
        deferred.notify(data);
    });

    cmd.stderr.on('data', function (err) {
        console.log(err.toString());
    });

    cmd.on('close', function (code) {
        if (code === 0) {
            deferred.resolve(command + ' complete');
        } else {
            deferred.reject(command + ' terminated with code ' + code);
        }
    });

    return deferred.promise;
};
