'use strict';

describe('Controller: ContactCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var ContactCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        ContactCtrl = $controller('ContactCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
