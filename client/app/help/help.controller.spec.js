'use strict';

describe('Controller: HelpCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var HelpCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        HelpCtrl = $controller('HelpCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
