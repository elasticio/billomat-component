describe('Billomat emailInvoice', function() {

    var emailInvoice = require('../lib/actions/emailInvoice.js');
    var nock        = require('nock');

    var cfg = {
        billomatId: 'billomatid',
        apiKey: 'billomatkey'
    };

    var self;

    beforeEach(function(){
        self = jasmine.createSpyObj('self',['emit']);
    });

    it('when invoice is successfully emailed, should emit data event', function() {

        var msg = {
            body: {
                id: 123456,
                from : 'admin@acme.org',
                subject : 'Your invoice 123456',
                body : 'Your invoice is attached',
                filename : 'invoice_123456.pdf',
                recipients: {
                    to: 'testuser@gmail.com'
                }
            }
        };

        var response = {

        };

        nock('https://billomatid.billomat.net')
            .post('/api/invoices/123456/email?api_key=billomatkey', {
                email : {
                    from: 'admin@acme.org',
                    subject: 'Your invoice 123456',
                    body: 'Your invoice is attached',
                    filename: 'invoice_123456.pdf',
                    recipients: {
                        to: 'testuser@gmail.com'
                    }
                }
            })
            .reply(200, JSON.stringify(response));

        runs(function(){
            emailInvoice.process.call(self, msg, cfg);
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

    it('when invoice is successfully emailed to invoice customer', function() {

        var msg = {
            body: {
                id: 123456,
                from : 'admin@acme.org',
                subject : 'Your invoice 123456',
                body : 'Your invoice is attached',
                filename : 'invoice_123456.pdf'
            }
        };

        var customerResponse = {
            clients : {
                client : {
                    email : 'foobarbaz@example.com'
                }
            }
        };

        var response = {

        };

        nock('https://billomatid.billomat.net')
            .get('/api/clients?invoice_id=123456&api_key=billomatkey', {})
            .reply(200, customerResponse)
            .post('/api/invoices/123456/email?api_key=billomatkey', {
                email : {
                    from: 'admin@acme.org',
                    subject: 'Your invoice 123456',
                    body: 'Your invoice is attached',
                    filename: 'invoice_123456.pdf',
                    recipients: {
                        to: 'foobarbaz@example.com'
                    }
                }
            })
            .reply(200, JSON.stringify(response));

        runs(function(){
            emailInvoice.process.call(self, msg, cfg);
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
            emailInvoice.process.call(self, {}, cfg);
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