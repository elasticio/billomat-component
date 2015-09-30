var billomat = require("./billomat.js");
var Q = require("q");
var _ = require('underscore');
var util = require('util');

function updateOrCreateClient(cfg, client){

    return findClientId().then(updateOrCreate);

    function findClientId(){
        if (client.id) {
            return Q.resolve(client.id);
        }
        if (client.email) {
            return promiseFindClientIdByEmail(cfg, client.email);
        }
        return Q.resolve(null);
    }

    function updateOrCreate(clientId){
        if (clientId) {
            return promiseUpdateClient(cfg, clientId, client);
        } else {
            return promiseCreateClient(cfg, client);
        }
    }
}

function promiseCreateClient(cfg, client){

    console.log('Create Billomat client');

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, 'clients'),
        json: {
            client: client
        }
    });
    return billomat.promiseResponse('post', request);
}

function promiseUpdateClient(cfg, id, client){

    console.log('Update Billomat client');

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, 'clients/' + id),
        json: {
            client: client
        }
    });
    return billomat.promiseResponse('put', request);
}

function promiseFindClientIdByEmail(cfg, email){

    return promiseFindClientIdByProperty(cfg, 'email', email).then(getClientIdFromSearchResults);
}

function promiseFindClientIdByInvoiceId(cfg, invoiceId) {

    return promiseFindClientIdByProperty(cfg, 'invoice_id', invoiceId);
}

function promiseFindClientIdByProperty(cfg, propertyName, propertyValue){

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, util.format('clients?%s=%s', propertyName, propertyValue)),
        json: {}
    });

    return billomat.promiseResponse('get', request);
}

function getClientIdFromSearchResults(response){

    if (response && response.clients && response.clients.client) {
        if (_.isArray(response.clients.client) && response.clients.client.length) {
            return response.clients.client[0].id;
        } else if (_.isObject(response.clients.client) && response.clients.client.id) {
            return response.clients.client.id;
        }
    }
}

exports.updateOrCreateClient = updateOrCreateClient;
exports.promiseFindClientIdByInvoiceId = promiseFindClientIdByInvoiceId;
