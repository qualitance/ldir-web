'use strict';

angular.module('ldrWebApp')
    .controller('AdminCtrl', ['$state', '$scope', 'LxDialogService', 'LxNotificationService', 'Pile', 'HelperService',
        '$filter', '$q', 'User', '$translate', 'responseHandler',
        function ($state, $scope, LxDialogService, LxNotificationService, Pile, HelperService,
                  $filter, $q, User, $translate, responseHandler) {

            $scope.state = $state;
            $scope.datepicker = null;
            $scope.clickable1 = false;
            $scope.clickable2 = false;

            $scope.openStatisticsModal = function (dialogId) {
                LxDialogService.open(dialogId);
            };

            $scope.getUsersCSV = function () {
                var deferred = $q.defer();
                User.getUsersStatistics().$promise.then(function (resp) {
                    var stats = responseHandler.getData(resp);
                    //format stats
                    var formatted = [];
                    //first, insert the header
                    formatted.push({
                        email: 'Email',
                        county: 'County',
                        first_name: 'First name',
                        last_name: 'Last name',
                        role: 'Role',
                        created_at: 'Created at'
                    });
                    //then insert all data
                    for (var i = 0; i < stats.length; i++) {
                        formatted.push({
                            email: stats[i].email,
                            county: stats[i].county ? stats[i].county.name : '',
                            first_name: stats[i].first_name,
                            last_name: stats[i].last_name,
                            role: stats[i].role,
                            created_at: moment(stats[i].created_at).format('YYYY/MM/DD')
                        });
                    }
                    deferred.resolve(formatted);
                });
                return deferred.promise;
            };

            $scope.getCountry = function (countryArray) {
                if (!angular.isArray(countryArray)) {
                    countryArray = [countryArray];
                }
                $scope.countryArray = countryArray;
                $scope.countryArray.unshift(HelperService.headerOnCsv('County'));
                $scope.clickable1 = false;
                $scope.clickable2 = false;
                return $scope.countryArray;
            };

            /*
             *Country report creation based on datepicker validation
             *see moment.js library function details
             *watcher to check validations
             *generate report
             */
            $scope.createCountryReport = function (dialogId) {

                LxDialogService.close(dialogId);
                $scope.datepicker = {};
                LxNotificationService.success($translate.instant('views.statistics.startDownload'));

            };

            $scope.$watchCollection('datepicker', function () {


                if ($scope.datepicker && $scope.datepicker.endDate) {
                    var maxDate = moment().add(1, 'day').startOf('day').toDate();
                    $scope.invalidEndDate = false;
                    if ($scope.datepicker.endDate > maxDate) {
                        $scope.invalidEndDate = true;
                        return;
                    }
                }
                if ($scope.datepicker && $scope.datepicker.startDate && $scope.datepicker.endDate) {
                    $scope.invalidStartDate = false;
                    if ($scope.datepicker.startDate > $scope.datepicker.endDate) {
                        $scope.invalidStartDate = true;
                        return;
                    }
                }

                if ($scope.datepicker && $scope.datepicker.startDate && $scope.datepicker.endDate) {

                    Pile.countyStatistics({
                            date_start: new Date($scope.datepicker.startDate),
                            date_end: new Date($scope.datepicker.endDate)
                        })
                        .$promise.then(function success(data) {

                        if (responseHandler.getData(data)) {
                            var statsByCounty = responseHandler.getData(data).defalcated;
                            var statsTotal = responseHandler.getData(data).total;
                            var index = 0;
                            var countryStatistics = [];
                            for (var county in statsByCounty) {
                                if (statsByCounty.hasOwnProperty(county)) {
                                    countryStatistics.push(HelperService.configObjectReport(statsByCounty[county], county, ++index));
                                }
                            }

                            // add total + date range
                            countryStatistics.push(HelperService.configObjectReport(statsTotal, 'Total', null, 'total'));
                            countryStatistics.push(HelperService.configObjectReport({
                                date_start: $filter('date')($scope.datepicker.startDate, 'yyyy-MM-dd'),
                                date_end: $filter('date')($scope.datepicker.endDate, 'yyyy-MM-dd')
                            }, 'Report interval', null, 'interval'));

                            $scope.countryStatistics = countryStatistics;

                        }
                    });
                }
            });

            $scope.closeStatisticsModal = function (dialogId) {
                LxDialogService.close(dialogId);
            };

            // evaluate calendar is open or not
            $scope.switchBoolean = function (bool) {

                var calendar = document.getElementsByClassName('lx-date-picker--is-shown');
                if (calendar.length === 1) {
                    bool = true;
                } else if (calendar.length === 0) {
                    bool = true;
                }
            };
        }]);
