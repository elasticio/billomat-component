var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var billomatInvoice = require("../common/invoice.js");

function createInvoice(msg, cfg){

    var that = this;
    billomatInvoice.updateOrCreateInvoice(cfg, msg)
        .then(onSuccess)
        .fail(onError)
        .done(onDone);

    function onSuccess(body) {
        that.emit('data', messages.newMessageWithBody(body));
    }

    function onError(err) {
        that.emit('error', err);
    }

    function onDone() {
        that.emit('end');
    }
}

exports.process = createInvoice;
