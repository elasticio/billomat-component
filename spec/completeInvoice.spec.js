describe('Billomat completeInvoice', function() {

    var completeInvoice = require('../lib/actions/completeInvoice.js');
    var nock        = require('nock');

    var cfg = {
        billomatId: 'billomatid',
        apiKey: 'billomatkey'
    };

    var self;

    beforeEach(function(){
        self = jasmine.createSpyObj('self',['emit']);
    });

    it('when invoice is successfully completed, should emit data event', function() {

        var msg = {
            body: {
                id: 123456
            }
        };

        var response = {

        };

        nock('https://billomatid.billomat.net')
            .put('/api/invoices/123456/complete?api_key=billomatkey')
            .reply(200, JSON.stringify(response));

        runs(function(){
            completeInvoice.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual({
                id: 123456
            });
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    it('when invoice ID is missing, should emit error', function() {

        runs(function(){
            completeInvoice.process.call(self, {}, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('error');
            expect(calls[0].args[1].message).toEqual('Invoice ID is required');
            expect(calls[1].args[0]).toEqual('end');
        });
    });

});
