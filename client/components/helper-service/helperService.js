'use strict';

angular.module('ldrWebApp').factory('HelperService', ['$q', '$translate', function ($q, $translate) {
    return {
        configObjectReport: function (object, label, i, type) {
            type = typeof type !== 'undefined' ? type : 'row';

            var o;
            switch (type) {
                case 'total':
                    o = {
                        id: '',
                        label: label,
                        total: object
                    };
                    break;
                case 'interval':
                    o = {
                        id: '',
                        label: label,
                        date_start: object.date_start,
                        date_end: object.date_end
                    };
                    break;
                default:
                    o = {
                        id: i ? i : 1,
                        county: label,
                        pending: object.status.hasOwnProperty('pending') ? parseInt(object.status.pending) : 0,
                        unconfirmed: object.status.hasOwnProperty('unconfirmed') ? parseInt(object.status.unconfirmed) : 0,
                        confirmed: object.status.hasOwnProperty('confirmed') ? parseInt(object.status.confirmed) : 0,
                        reported: object.status.hasOwnProperty('reported') ? parseInt(object.status.reported) : 0,
                        cleaned: object.status.hasOwnProperty('clean') ? parseInt(object.status.clean) : 0,
                        food: object.content.food ? object.content.food : 0,
                        paper: object.content.paper ? object.content.paper : 0,
                        glass: object.content.glass ? object.content.glass : 0,
                        plastic: object.content.plastic ? object.content.plastic : 0,
                        steel: object.content.steel ? object.content.steel : 0,
                        wood: object.content.wood ? object.content.wood : 0,
                        household: (object.content.household || object.content.householdgarbage) ? ((object.content.household || 0) + (object.content.householdgarbage || 0)) : 0,
                        batteries: object.content.batteries ? object.content.batteries : 0,
                        textiles: object.content.textiles ? object.content.textiles : 0,
                        picnic: (object.content.picnic || object.content.picnicgarbage) ? ((object.content.picnic || 0) + (object.content.picnicgarbage || 0)) : 0,
                        aluminium: object.content.aluminium ? object.content.aluminium : 0,
                        building: (object.content.building || object.content.buildingmaterials) ? ((object.content.building || 0) + (object.content.buildingmaterials || 0)) : 0,
                        electronic: (object.content.electronic || object.content.electronicwaste) ? ((object.content.electronic || 0) + (object.content.electronicwaste || 0)) : 0,
                        other: object.content.other ? object.content.other : 0,
                        size1: object.size['1'] ? object.size['1'] : 0,
                        size2: object.size['2'] ? object.size['2'] : 0,
                        size3: object.size['3'] ? object.size['3'] : 0,
                        size4: object.size['4'] ? object.size['4'] : 0,
                        size5: object.size['5'] ? object.size['5'] : 0
                    };
                    o.total = o.pending + o.unconfirmed + o.confirmed + o.reported + o.cleaned;
                    break;
            }

            return o;
        },
        headerOnCsv: function (locationHeader) {
            var headerObject = {
                id: 'ID',
                county: locationHeader,
                a: $translate.instant('helperService.pendingStatus'),
                b: $translate.instant('helperService.uncofirmedStatus'),
                c: $translate.instant('helperService.confirmedStatus'),
                d: $translate.instant('helperService.reportedStatus'),
                e: $translate.instant('helperService.cleanedStatus'),
                f: $translate.instant('helperService.foodWaste'),
                g: $translate.instant('helperService.paperWaste'),
                h: $translate.instant('helperService.glassWaste'),
                i: $translate.instant('helperService.plasticWaste'),
                j: $translate.instant('helperService.steelWaste'),
                k: $translate.instant('helperService.woodWaste'),
                l: $translate.instant('helperService.householdWaste'),
                m: $translate.instant('helperService.batteriesWaste'),
                n: $translate.instant('helperService.textilesWaste'),
                o: $translate.instant('helperService.picnicWaste'),
                p: $translate.instant('helperService.aluminumWaste'),
                q: $translate.instant('helperService.buildingWaste'),
                r: $translate.instant('helperService.electronicWaste'),
                s: $translate.instant('helperService.otherWaste'),
                t: $translate.instant('helperService.sizeOneWaste'),
                u: $translate.instant('helperService.sizeTwoWaste'),
                v: $translate.instant('helperService.sizeThreeWaste'),
                w: $translate.instant('helperService.sizeFourWaste'),
                x: $translate.instant('helperService.sizeFiveWaste'),
                y: 'Total'
            };
            return headerObject;
        },
        generateThumbnail: function (image) {
            var deferred = $q.defer();

            var reader = new FileReader();
            reader.onloadend = function () {
                var dataUrl = reader.result;
                deferred.resolve(dataUrl);
            };
            reader.readAsDataURL(image);
            return deferred.promise;
        },
        getPileMaterials: function () {
            return angular.copy([
                {name: $translate.instant('helperService.plastic'), type: 'Plastic', selected: false},
                {name: $translate.instant('helperService.aluminum'), type: 'Aluminium', selected: false},
                {name: $translate.instant('helperService.glass'), type: 'Glass', selected: false},
                {name: $translate.instant('helperService.paper'), type: 'Paper', selected: false},
                {name: $translate.instant('helperService.household'), type: 'Household Garbage', selected: false},
                {name: $translate.instant('helperService.building'), type: 'Building materials', selected: false},
                {name: $translate.instant('helperService.electronic'), type: 'Electronic waste', selected: false},
                {name: $translate.instant('helperService.batteries'), type: 'Batteries', selected: false},
                {name: $translate.instant('helperService.textiles'), type: 'Textiles', selected: false},
                {name: $translate.instant('helperService.other'), type: 'Other', selected: false}
            ]);
        },
        getPileAreas: function () {
            return angular.copy([
                {name: $translate.instant('helperService.cityArea'), type: 'city', selected: false},
                {name: $translate.instant('helperService.forestArea'), type: 'forest', selected: false},
                {name: $translate.instant('helperService.fieldArea'), type: 'field', selected: false},
                {name: $translate.instant('helperService.waterArea'), type: 'water', selected: false},
                {name: $translate.instant('helperService.otherArea'), type: 'other', selected: false}
            ]);
        },
        getUserRoles: function () {
            return angular.copy([
                {name: $translate.instant('helperService.volunteerRole'), value: 'Volunteer', type: 'volunteer'},
                {name: $translate.instant('helperService.supervisorRole'), value: 'Supervisor', type: 'supervisor'},
                {name: $translate.instant('helperService.adminRole'), value: 'admin', type: 'admin'}
            ]);
        },
        getUserStatuses: function () {
            return angular.copy([
                {name: $translate.instant('helperService.active'), type: 'active', value: 'Active'},
                {name: $translate.instant('helperService.pending'), type: 'pending', value: 'Pending'},
                {name: $translate.instant('helperService.inactive'), type: 'inactive', value: 'Inactive'}
            ]);
        },
        getPileStatuses: function () {
            return angular.copy([
                {name: $translate.instant('helperService.allPile'), type: null, value: 'All'},
                {name: $translate.instant('helperService.pendingPile'), type: 'pending', value: 'Pending'},
                {name: $translate.instant('helperService.unconfirmedPile'), type: 'unconfirmed', value: 'Unconfirmed'},
                {name: $translate.instant('helperService.confirmedPile'), type: 'confirmed', value: 'Confirmed'},
                {name: $translate.instant('helperService.reportedPile'), type: 'reported', value: 'Reported'},
                {name: $translate.instant('helperService.cleanedPile'), type: 'clean', value: 'Cleaned'}
            ]);
        },
        getAvailableLanguages: function () {
            return angular.copy([
                {name: $translate.instant('helperService.english'), type: 'en', value: 'en'},
                {name: $translate.instant('helperService.romanian'), type: 'ro', value: 'ro'}
            ]);
        }
    };
}]);

