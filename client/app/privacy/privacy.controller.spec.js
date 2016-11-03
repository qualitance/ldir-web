'use strict';

describe('Controller: PrivacyCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var PrivacyCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        PrivacyCtrl = $controller('PrivacyCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
