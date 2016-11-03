'use strict';

describe('Controller: TermsCtrl', function () {

    beforeEach(module('ldrWebApp'));

    var TermsCtrl, scope;

    beforeEach(inject(function ($controller, $rootScope) {
        scope = $rootScope.$new();
        TermsCtrl = $controller('TermsCtrl', {
            $scope: scope
        });
    }));

    it('should ...', function () {
        expect(1).toEqual(1);
    });
});
