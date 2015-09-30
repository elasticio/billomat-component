var elasticio = require('elasticio-node');
var messages = elasticio.messages;
var billomatClient = require("../common/client.js");

function processClient(msg, cfg){

    var that = this;
    var client = msg.body.client;

    billomatClient.updateOrCreateClient(cfg, client)
        .then(onSuccess)
        .fail(onError)
        .done();

    function onSuccess(body) {
        that.emit('data', messages.newMessageWithBody(body));
        that.emit('end');
    }

    function onError(err) {
        that.emit('error', err);
        that.emit('end');
    }
}



exports.process = processClient;
