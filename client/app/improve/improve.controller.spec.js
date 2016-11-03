'use strict';

describe('Controller: ImproveCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var ImproveCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        ImproveCtrl = $controller('ImproveCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
