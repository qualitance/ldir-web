'use strict';

describe('Controller: MainCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var MainCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        MainCtrl = $controller('MainCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});

