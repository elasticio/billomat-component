var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var client = require("../common/client.js");
var billomat = require("../common/billomat.js");
var Q = require('q');
var HttpComponent = elasticio.HttpComponent;

function emailInvoice(msg, cfg){

    var that = this;

    if (!msg.body || !msg.body.id) {
        that.emit('error', new Error('Invoice ID is required'));
        that.emit('end');
        return;
    }

    console.log("About to send invoice (id=%s) by email", msg.body.id);

    promiseRecipientTo(cfg, msg).then(sendEmail).done();

    function sendEmail(recipientTo) {
        var invoiceId = msg.body.id;

        var request = billomat.createRequest({
            url: billomat.getUrl(cfg, 'invoices/' + invoiceId + '/email'),
            json: {
                email: {
                    from: msg.body.from,
                    subject: msg.body.subject,
                    body: msg.body.body,
                    filename: msg.body.filename,
                    recipients: {
                        to: recipientTo
                    }
                }
            }
        });

        new HttpComponent(that).success(onSuccess).post(request);

        function onSuccess(response, body){
            if (response.statusCode !== 200) {
                throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
            }
            that.emit('data', messages.newMessageWithBody({id: invoiceId}));
        }
    }

    function promiseRecipientTo(cfg, msg) {

        if (msg.body.recipients && msg.body.recipients.to) {
            return Q(msg.body.recipients.to);
        }

        console.log("No email recipient (TO) was configured");

        function getClientEmail(result) {

            if (!result.clients || !result.clients.client) {
                throw new Error("Not clients found");
            }

            var client = result.clients.client;

            console.log("Invoice will be sent to client with id=%s", client.id);

            return client.email;
        }

        var invoiceId = msg.body.id;

        console.log("About to get client by invoice_id=%s", invoiceId);

        return client.promiseFindClientIdByInvoiceId(cfg, invoiceId).then(getClientEmail);
    }
}

exports.process = emailInvoice;