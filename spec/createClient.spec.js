describe('Billomat createClient', function() {

    var createClient = require('../lib/actions/createClient.js');
    var nock        = require('nock');

    var cfg = {
        billomatId: 'billomatid',
        apiKey: 'billomatkey'
    };

    var self;

    beforeEach(function(){
        self = jasmine.createSpyObj('self',['emit']);
    });

    it('when client is created, should emit data event', function() {

        var msg = {
            body: {
                client: {
                    first_name: 'Homer',
                    last_name: 'Simpson'
                }
            }
        };

        var response = {
            client: {
                id: 123456,
                first_name: 'Homer',
                last_name: 'Simpson'
            }
        };

        nock('https://billomatid.billomat.net')
            .post('/api/clients?api_key=billomatkey')
            .reply(201, JSON.stringify(response));

        runs(function(){
            createClient.process.call(self, msg, cfg);
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

    it('when client is updated, should emit data event', function() {

        var msg = {
            body: {
                client: {
                    id: 123456,
                    first_name: 'Homer',
                    last_name: 'Simpson'
                }
            }
        };

        var response = {
            client: {
                id: 123456,
                first_name: 'Homer',
                last_name: 'Simpson'
            }
        };

        nock('https://billomatid.billomat.net')
            .put('/api/clients/123456?api_key=billomatkey')
            .reply(201, JSON.stringify(response));

        runs(function(){
            createClient.process.call(self, msg, cfg);
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

    it('when client is not created, should emit error', function() {

        var msg = {
            body: {
                client: {
                    first_name: 'Homer',
                    last_name: 'Simpson'
                }
            }
        };

        nock('https://billomatid.billomat.net')
            .post('/api/clients?api_key=billomatkey')
            .reply(404, {error: 'Client not found'});

        runs(function(){
            createClient.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('error');
            expect(calls[0].args[1].message).toEqual('{"error":"Client not found"}');
            expect(calls[1].args[0]).toEqual('end');
        });
    });


    it('when client email is provided, should search a client, if multiple clients found - update first found client', function() {

        process.env.BILLOMAT_APP_ID = 69;
        process.env.BILLOMAT_APP_SECRET = 'e2e857cc19742489bb36cb70f43250c5';

        var msg = {
            body: {
                client: {
                    first_name: 'Homer',
                    last_name: 'Simpson',
                    email: 'homersimpson@gmail.com'
                }
            }
        };

        var findResponse = {
            clients: {
                client: [{
                    id: 123456,
                    first_name: 'Homer',
                    last_name: 'Simpson'
                },
                {
                    id: 123457,
                    first_name: 'Berta',
                    last_name: 'Simpson'
                }]
            }
        };

        var updateResponse = {
            client: {
                id: 123456,
                first_name: 'Homer',
                last_name: 'Simpson'
            }
        };

        nock('https://billomatid.billomat.net')
            .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
            .reply(200, findResponse);

        nock('https://billomatid.billomat.net')
            .put('/api/clients/123456?api_key=billomatkey')
            .reply(200, updateResponse);

        runs(function(){
            createClient.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual(updateResponse);
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    it('when client email is provided, should search a client, if one client found - update that client', function() {

        process.env.BILLOMAT_APP_ID = 69;
        process.env.BILLOMAT_APP_SECRET = 'e2e857cc19742489bb36cb70f43250c5';

        var msg = {
            body: {
                client: {
                    first_name: 'Homer',
                    last_name: 'Simpson',
                    email: 'homersimpson@gmail.com'
                }
            }
        };

        var findResponse = {
            clients: {
                client: {
                    id: 123456,
                    first_name: 'Homer',
                    last_name: 'Simpson'
                }
            }
        };

        var updateResponse = {
            client: {
                id: 123456,
                first_name: 'Homer',
                last_name: 'Simpson'
            }
        };

        nock('https://billomatid.billomat.net')
            .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
            .reply(200, findResponse);

        nock('https://billomatid.billomat.net')
            .put('/api/clients/123456?api_key=billomatkey')
            .reply(200, updateResponse);

        runs(function(){
            createClient.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual(updateResponse);
            expect(calls[1].args[0]).toEqual('end');
        });
    });

    it('when client email is provided and client does not exist, should create that client', function() {

        process.env.BILLOMAT_APP_ID = 69;
        process.env.BILLOMAT_APP_SECRET = 'e2e857cc19742489bb36cb70f43250c5';

        var msg = {
            body: {
                client: {
                    first_name: 'Homer',
                    last_name: 'Simpson',
                    email: 'homersimpson@gmail.com'
                }
            }
        };

        var findResponse = {
            clients: {
                client: []
            }
        };

        var createResponse = {
            client: {
                id: 123456,
                first_name: 'Homer',
                last_name: 'Simpson'
            }
        };

        nock('https://billomatid.billomat.net')
            .get('/api/clients?email=homersimpson@gmail.com&api_key=billomatkey')
            .reply(200, findResponse);

        nock('https://billomatid.billomat.net')
            .post('/api/clients?api_key=billomatkey')
            .reply(200, createResponse);

        runs(function(){
            createClient.process.call(self, msg, cfg);
        });

        waitsFor(function () {
            return self.emit.calls.length >= 2;
        });

        runs(function(){
            var calls = self.emit.calls;
            expect(calls.length).toEqual(2);

            expect(calls[0].args[0]).toEqual('data');
            expect(calls[0].args[1].body).toEqual(createResponse);
            expect(calls[1].args[0]).toEqual('end');
        });
    });

});
