describe('Verify Credentials', function () {
    var nock = require('nock');
    var request = require('request');

    var verify = require('../verifyCredentials.js');

    var cfg;
    var cb;
    var billomatId = 'billomatid';

    var BASE_URL = 'https://'+billomatId+'.billomat.net';

    var path = '/api/users/myself?api_key=super-api-key';

    beforeEach(function () {
        cfg = {
            billomatId: billomatId,
            apiKey: 'super-api-key'
        };

        cb = jasmine.createSpy('cb');
    });

    it('should provide message if user doesn\'t provide any credentials', function () {
        var cfg = {};

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb).toHaveBeenCalledWith(null, {verified: false});
        });
    });

    it('should return verified false for 404 answer', function () {

        nock(BASE_URL)
            .get(path)
            .reply(404, '');

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb).toHaveBeenCalledWith(null, {verified: false});
        });
    });

    it('should return verified true for 200 answer', function () {
        nock(BASE_URL)
            .get(path)
            .reply(200, {});

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb).toHaveBeenCalledWith(null, {verified: true});
        });
    });

    it('should return error for 500 cases', function () {

        nock(BASE_URL)
            .get(path)
            .reply(500, {message: 'super error 500'});


        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb.calls[0].args[0].message).toEqual('{"message":"super error 500"}');
        });
    });

    it('should return error for error cases', function () {

        spyOn(request, 'get').andCallFake(function (opt, cb) {
            cb({message: 'super error'});
        });

        waitsFor(function () {
            return cb.callCount;
        });

        verify(cfg, cb);

        runs(function () {
            expect(cb).toHaveBeenCalled();
            expect(cb.calls.length).toEqual(1);
            expect(cb.calls[0].args[0].message).toEqual('super error');
        });
    });


});