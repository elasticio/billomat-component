var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var billomat = require("../common/billomat.js");
var HttpComponent = elasticio.HttpComponent;

function completeInvoice(msg, cfg){

    var that = this;

    if (!msg.body || !msg.body.id) {
        that.emit('error', new Error('Invoice ID is required'));
        that.emit('end');
        return;
    }

    var invoiceId = msg.body.id;

    var request = billomat.createRequest({
        url: billomat.getUrl(cfg, 'invoices/' + invoiceId + '/complete'),
        json: {
            complete: {}
        }
    });

    new HttpComponent(that).success(onSuccess).put(request);

    function onSuccess(response, body){
        if (response.statusCode !== 200) {
            throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
        }
        that.emit('data', messages.newMessageWithBody({id: invoiceId}));
    }
}

exports.process = completeInvoice;