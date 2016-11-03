'use strict';
/**
 * @name parseAndTranslate.filter:parseAndTranslate
 * @description
 * Returns the translated property which we want to display in view
 * @param {string} propertyToTranslate - translate the string based on the name of the property
 */
angular.module('ldrWebApp')
    .filter('parseAndTranslate', ['$translate', function ($translate) {
        return function (input, propertyToTranslate) {
            switch (propertyToTranslate) {
                case 'status' :
                    switch (input) {
                        case 'pending' :
                            return $translate.instant('helperService.pendingPile');
                        case 'confirmed' :
                            return $translate.instant('helperService.confirmedPile');
                        case 'unconfirmed' :
                            return $translate.instant('helperService.unconfirmedPile');
                        case 'cleaned' :
                            return $translate.instant('helperService.cleanedPile');
                        case 'clean' :
                            return $translate.instant('helperService.cleanedPile');
                        case 'reported' :
                            return $translate.instant('helperService.reportedPile');
                    }
                    break;
                case 'content' :
                    var stringToAnalyze = input.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ')[0].toLowerCase();
                    switch (stringToAnalyze) {
                        case 'plastic' :
                            return $translate.instant('helperService.plastic');
                        case 'aluminium' :
                            return $translate.instant('helperService.aluminum');
                        case 'glass' :
                            return $translate.instant('helperService.glass');
                        case 'paper' :
                            return $translate.instant('helperService.paper');
                        case 'household' :
                            return $translate.instant('helperService.household');
                        case 'building' :
                            return $translate.instant('helperService.building');
                        case 'electronic' :
                            return $translate.instant('helperService.electronic');
                        case 'batteries' :
                            return $translate.instant('helperService.batteries');
                        case 'textiles' :
                            return $translate.instant('helperService.textiles');
                        case 'other' :
                            return $translate.instant('helperService.other');
                        case 'food' :
                            return $translate.instant('helperService.food');
                        case 'steel' :
                            return $translate.instant('helperService.steel');
                        case 'wood' :
                            return $translate.instant('helperService.wood');
                        case 'picnic' :
                            return $translate.instant('helperService.picnic');
                    }
                    break;
                case 'zones' :

                    switch (input) {
                        case 'city' :
                            return $translate.instant('helperService.cityArea');
                        case 'forest' :
                            return $translate.instant('helperService.forestArea');
                        case 'water' :
                            return $translate.instant('helperService.waterArea');
                        case 'field' :
                            return $translate.instant('helperService.fieldArea');
                        case 'other' :
                            return $translate.instant('helperService.otherArea');
                    }
                    break;
                case 'roles' :

                    switch (input) {
                        case 'volunteer' :
                            return $translate.instant('helperService.volunteerRole');
                        case 'supervisor' :
                            return $translate.instant('helperService.supervisorRole');
                        case 'admin' :
                            return $translate.instant('helperService.adminRole');
                    }
                    break;
                case 'userStatus' :

                    switch (input) {
                        case 'active' :
                            return $translate.instant('helperService.active');
                        case 'pending' :
                            return $translate.instant('helperService.pending');
                        case 'inactive' :
                            return $translate.instant('helperService.inactive');
                    }
                    break;
                case 'language' :

                    switch (input) {
                        case 'en' :
                            return $translate.instant('helperService.english');
                        case 'ro' :
                            return $translate.instant('helperService.romanian');
                    }
                    break;
            }
        };
    }]);
