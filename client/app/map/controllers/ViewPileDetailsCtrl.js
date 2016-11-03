'use strict';
angular.module('ldrWebApp').controller('ViewPileCtrl', [
    '$scope',
    '$state',
    'Pile',
    'CommentsService',
    'HelperService',
    '$sce',
    'ImageUpload',
    'currentPile',
    'LxDialogService',
    'LxNotificationService',
    'Auth',
    '$translate',
    'responseHandler',
    function ($scope, $state, Pile, CommentsService, HelperService, $sce, ImageUpload, currentPile, LxDialogService,
              LxNotificationService, Auth, $translate, responseHandler) {

        $scope.comment = {};
        $scope.mapdialog = false;

        $scope.pile = new Pile(currentPile);
        Auth.getCurrentUser().$promise.then(function (data) {
            $scope.user = responseHandler.getData(data);
        });
        $scope.hasRole = Auth.hasRole;
        $scope.bgImage = '#FFF url("../assets/images/map/type_description_' + Auth.getCurrentUser().language +
            '.svg") no-repeat center center';

        CommentsService.query({pile: $state.params.id}).$promise.then(function success(data) {
            $scope.comments = responseHandler.getData(data);
        });

        $scope.confirmStatus = function (what) {
            Pile.confirm({action: what, pile: $scope.pile._id}).$promise.then(function success(data) {
                angular.extend($scope.pile, responseHandler.getData(data));
            });
        };

        $scope.hidePile = function (pile) {
            pile.is_hidden = true;
            Pile.hide({id: pile._id}, pile).$promise.then(function (data) {
                $scope.pile = responseHandler.getData(data);
                LxNotificationService.success($translate.instant('views.editViewPile.successHide'));
            });
        };

        $scope.unhidePile = function (pile) {
            pile.is_hidden = false;
            Pile.hide({id: pile._id}, pile).$promise.then(function (data) {
                $scope.pile = responseHandler.getData(data);
                LxNotificationService.success($translate.instant('views.editViewPile.successUnhide'));
            });
        };

        $scope.files = [];

        $scope.openMapDialog = function (dialogId) {
            $scope.mapdialog = true;
            LxDialogService.open(dialogId);
        };
        $scope.closeMapDialog = function (dialogId) {
            $scope.mapdialog = false;
            LxDialogService.close(dialogId);
        };
        $scope.closingMapDialog = function () {
            $scope.mapdialog = false;
        };

        $scope.openCommentDialog = function (dialogId) {
            LxDialogService.open(dialogId);
        };
        $scope.closeCommentDialog = function (form, dialogId) {
            LxDialogService.close(dialogId);
            form.$setPristine();
            $scope.comment.description = '';
        };
        $scope.closingCommentDialog = function (form) {
            $scope.$eval(form).$setPristine();
            $scope.comment.description = '';
        };

        $scope.selectFiles = function (files) {
            angular.forEach(files, function (file) {
                HelperService.generateThumbnail(file).then(function (imageUrl) {
                    file.thumbnailImage = $sce.trustAsResourceUrl(imageUrl);
                    $scope.files.push(file);
                });
            });
        };
        $scope.addComment = function (comment) {
            $scope.comments.unshift(comment);
        };

        $scope.postComment = function (form, dialogId) {
            if (form.$valid) {
                CommentsService.create({pile: $state.params.id}, {
                    description: $scope.comment.description
                }).$promise.then(function success(resp_comment) {
                    var comment = responseHandler.getData(resp_comment);
                    $scope.comment.description = '';
                    $scope.addComment(comment);
                    LxNotificationService.success($translate.instant('views.editViewPile.successComment'));

                });
                $scope.closeCommentDialog(form, dialogId);
            } else {
                if (form.comment.$error.required || form.comment.$error.minlength) {
                    LxNotificationService.info($translate.instant('views.editViewPile.addCommentDialog.commentTenChars'));
                }
            }

        };

    }]);
