describe('Billomat createInvoice', function() {

    var createInvoice = require('../lib/actions/createInvoice.js');
    var nock        = require('nock');

    var cfg = {
        billomatId: 'billomatid',
        apiKey: 'billomatkey'
    };

    var self;

    beforeEach(function(){
        self = jasmine.createSpyObj('self',['emit']);
    });

    it('when client ID is provided, it should create new order for that client  ID', function() {

        var msg = {
            body: {
                invoice: {
                    client_id: 121212,
                    title: 'Invoice #123456'
                },
                "invoice-items": [
                    {"invoice-item": { title: 'Item 1', quantity: 1}},
                    {"invoice-item": { title: 'Item 2', quantity: 2}}
                ]
            }
        };

        var response = {
            invoice: {
                id: 123456,
                client_id: 121212
            }
        };

        nock('https://billomatid.billomat.net')
            .post('/api/invoices?api_key=billomatkey', require('./data/invoice.json'))
            .reply(201, JSON.stringify(response));

        runs(function(){
            createInvoice.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual(response);
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    it('when client ID is not provided, it should create new client and then create new order for that client', function() {

        var msg = {
            body: {
                invoice: {
                    title: 'Invoice #123456'
                },
                client: {
                    title: 'Invoice #123456'
                },
                "invoice-items": [
                    {"invoice-item": { title: 'Item 1', quantity: 1}},
                    {"invoice-item": { title: 'Item 2', quantity: 2}}
                ]
            }
        };

        var createClientResponse = {
            client: {
                id: 123456
            }
        };

        var createInvoiceResponse = {
            invoice: {
                id: 78910
            }
        };

        nock('https://billomatid.billomat.net')
            .post('/api/clients?api_key=billomatkey')
            .reply(201, JSON.stringify(createClientResponse));

        nock('https://billomatid.billomat.net')
            .post('/api/invoices?api_key=billomatkey', require('./data/invoice_reverse_charge_no_vat.json'))
            .reply(201, JSON.stringify(createInvoiceResponse));

        runs(function(){
            createInvoice.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual(createInvoiceResponse);
            expect(calls[1].args[0]).toEqual('end');
        });
    });


    it('when invoice is not created, should emit error', function() {

        var msg = {
            body: {
                invoice: {
                    client_id: 121212,
                    title: 'Invoice #123456'
                },
                "invoice-items": [
                    {"invoice-item": { title: 'Item 1', quantity: 1}},
                    {"invoice-item": { title: 'Item 2', quantity: 2}}
                ]
            }
        };

        nock('https://billomatid.billomat.net')
            .post('/api/invoices?api_key=billomatkey')
            .reply(404, {error: 'Invoice not found'});

        runs(function(){
            createInvoice.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('error');
            expect(calls[0].args[1].message).toEqual('{"error":"Invoice not found"}');
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    describe('Reverse Charge', function() {
        it('Non-German client with VAT', function() {

            var msg = {
                body: {
                    invoice: {
                        title: 'Invoice #123456'
                    },
                    client: {
                        email: 'homersimpson@gmail.com'
                    },
                    "invoice-items": [
                        {"invoice-item": { title: 'Item 1', quantity: 1}},
                        {"invoice-item": { title: 'Item 2', quantity: 2}}
                    ]
                }
            };

            var findClientResponse = {
                clients: {
                    client: [
                        {
                            id: 123456,
                            vat_number : 'DK123'
                        }
                    ]
                }
            };

            var updateClientResponse = {
                client: {
                    id: 123456,
                    vat_number : 'DK123'
                }
            };


            var createInvoiceResponse = {
                invoice: {
                    id: 78910
                }
            };

            nock('https://billomatid.billomat.net')
                .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
                .reply(200, findClientResponse);

            nock('https://billomatid.billomat.net')
                .put('/api/clients/123456?api_key=billomatkey')
                .reply(200, updateClientResponse);

            nock('https://billomatid.billomat.net')
                .post('/api/invoices?api_key=billomatkey', require('./data/invoice_reverse_charge_vat.json'))
                .reply(201, JSON.stringify(createInvoiceResponse));

            runs(function(){
                createInvoice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length >= 2;
            });

            runs(function(){
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);

                expect(calls[0].args[0]).toEqual('data');
                expect(calls[0].args[1].body).toEqual(createInvoiceResponse);
                expect(calls[1].args[0]).toEqual('end');
            });
        });

        it('Non-German client with VAT, invoice has a defined note', function() {

            var msg = {
                body: {
                    invoice: {
                        title: 'Invoice #123456',
                        note : 'Your credit card has been charged already'
                    },
                    client: {
                        email: 'homersimpson@gmail.com'
                    },
                    "invoice-items": [
                        {"invoice-item": { title: 'Item 1', quantity: 1}},
                        {"invoice-item": { title: 'Item 2', quantity: 2}}
                    ]
                }
            };

            var findClientResponse = {
                clients: {
                    client: [
                        {
                            id: 123456,
                            vat_number : 'DK123'
                        }
                    ]
                }
            };

            var updateClientResponse = {
                client: {
                    id: 123456,
                    vat_number : 'DK123'
                }
            };


            var createInvoiceResponse = {
                invoice: {
                    id: 78910
                }
            };

            nock('https://billomatid.billomat.net')
                .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
                .reply(200, findClientResponse);

            nock('https://billomatid.billomat.net')
                .put('/api/clients/123456?api_key=billomatkey')
                .reply(200, updateClientResponse);

            nock('https://billomatid.billomat.net')
                .post('/api/invoices?api_key=billomatkey', require('./data/invoice_reverse_charge_vat_additional_note.json'))
                .reply(201, JSON.stringify(createInvoiceResponse));

            runs(function(){
                createInvoice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length >= 2;
            });

            runs(function(){
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);

                expect(calls[0].args[0]).toEqual('data');
                expect(calls[0].args[1].body).toEqual(createInvoiceResponse);
                expect(calls[1].args[0]).toEqual('end');
            });
        });

        it('Non-German client without VAT', function() {

            var msg = {
                body: {
                    invoice: {
                        title: 'Invoice #123456'
                    },
                    client: {
                        email: 'homersimpson@gmail.com'
                    },
                    "invoice-items": [
                        {"invoice-item": { title: 'Item 1', quantity: 1}},
                        {"invoice-item": { title: 'Item 2', quantity: 2}}
                    ]
                }
            };

            var findClientResponse = {
                clients: {
                    client: [
                        {
                            id: 123456
                        }
                    ]
                }
            };

            var updateClientResponse = {
                client: {
                    id: 123456
                }
            };


            var createInvoiceResponse = {
                invoice: {
                    id: 78910
                }
            };

            nock('https://billomatid.billomat.net')
                .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
                .reply(200, findClientResponse);

            nock('https://billomatid.billomat.net')
                .put('/api/clients/123456?api_key=billomatkey')
                .reply(200, updateClientResponse);

            nock('https://billomatid.billomat.net')
                .post('/api/invoices?api_key=billomatkey', require('./data/invoice_reverse_charge_no_vat.json'))
                .reply(201, JSON.stringify(createInvoiceResponse));

            runs(function(){
                createInvoice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length >= 2;
            });

            runs(function(){
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);

                expect(calls[0].args[0]).toEqual('data');
                expect(calls[0].args[1].body).toEqual(createInvoiceResponse);
                expect(calls[1].args[0]).toEqual('end');
            });
        });

        it('German client with VAT', function() {

            var msg = {
                body: {
                    invoice: {
                        title: 'Invoice #123456',
                        note : 'Your credit card has been charged already'
                    },
                    client: {
                        email: 'homersimpson@gmail.com'
                    },
                    "invoice-items": [
                        {"invoice-item": { title: 'Item 1', quantity: 1}},
                        {"invoice-item": { title: 'Item 2', quantity: 2}}
                    ]
                }
            };

            var findClientResponse = {
                clients: {
                    client: [
                        {
                            id: 123456,
                            vat_number : 'DE9999'
                        }
                    ]
                }
            };

            var updateClientResponse = {
                client: {
                    id: 123456,
                    vat_number : 'DE9999'
                }
            };


            var createInvoiceResponse = {
                invoice: {
                    id: 78910
                }
            };

            nock('https://billomatid.billomat.net')
                .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
                .reply(200, findClientResponse);

            nock('https://billomatid.billomat.net')
                .put('/api/clients/123456?api_key=billomatkey')
                .reply(200, updateClientResponse);

            nock('https://billomatid.billomat.net')
                .post('/api/invoices?api_key=billomatkey', require('./data/invoice_with_note.json'))
                .reply(201, JSON.stringify(createInvoiceResponse));

            runs(function(){
                createInvoice.process.call(self, msg, cfg);
            });

            waitsFor(function () {
                return self.emit.calls.length >= 2;
            });

            runs(function(){
                var calls = self.emit.calls;
                expect(calls.length).toEqual(2);

                expect(calls[0].args[0]).toEqual('data');
                expect(calls[0].args[1].body).toEqual(createInvoiceResponse);
                expect(calls[1].args[0]).toEqual('end');
            });
        });
    });
});
