'use strict';

describe('Service: IssueService', function () {

    beforeEach(module('ldrWebApp'));

    var IssueService;
    beforeEach(inject(function (_IssueService_) {
        IssueService = _IssueService_;
    }));

    it('should do something', function () {
        expect(!!IssueService).toBe(true);
    });

});
