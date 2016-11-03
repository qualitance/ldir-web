'use strict';

describe('Controller: IssuesListCtrlCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var IssuesListCtrlCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        IssuesListCtrlCtrl = $controller('IssuesListCtrlCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
