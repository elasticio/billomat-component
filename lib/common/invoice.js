var billomat = require("./billomat.js");
var client = require("./client.js");
var Q = require("q");
var _ = require('underscore');

function updateOrCreateInvoice(cfg, msg){

    msg.body.invoice["invoice-items"] = msg.body["invoice-items"];

    return promiseClientId()
        .then(findInvoiceId)
        .then(updateOrCreate);

    function promiseClientId(){
        if (msg.body.invoice.client_id) return Q.resolve();

        return client.updateOrCreateClient(cfg, msg.body.client).then(function(clientData){

            addReverseChargeProcedureNote(msg.body.invoice, clientData.client);

            msg.body.invoice.client_id = clientData.client.id;
            return Q.resolve();
        });
    }

    function findInvoiceId(){
        return Q.resolve();
    }

    function updateOrCreate(invoiceId){
        if (invoiceId) {
            return promiseUpdateInvoice(cfg, invoiceId, msg.body.invoice);
        } else {
            return promiseCreateInvoice(cfg, msg.body.invoice);
        }
    }

    function addReverseChargeProcedureNote(invoice, client) {

        var vatNumber = client.vat_number;

        if (vatNumber && vatNumber.indexOf('DE') === 0) {
            return;
        }

        var note = invoice.note ? invoice.note + ' \n\n' : '';

        note += 'Reverse Charge Procedure / VAT taxable at recipient';

        if (vatNumber) {
            note += ' / ' + vatNumber;
        }

        invoice.note = note;
    }
}

function promiseCreateInvoice(cfg, invoice){

    console.log('Create Billomat invoice');

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, 'invoices'),
        json: {
            invoice: invoice
        }
    });

    return billomat.promiseResponse('post', request);
}

function promiseUpdateInvoice(cfg, id, invoice){

    console.log('Update Billomat invoice');

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, 'invoices/' + id),
        json: {
            invoice: invoice
        }
    });

    return billomat.promiseResponse('put', request);
}

exports.updateOrCreateInvoice = updateOrCreateInvoice;