var request = require('request');
var util = require('util');
var Q = require("q");

var BASE_URI = 'https://%s.billomat.net/api/';

function getUrl(cfg, path) {
    var url = util.format(BASE_URI, cfg.billomatId);
    url += path;
    if (path.match(/\?/)) {
        url += '&api_key=' + cfg.apiKey;
    } else {
        url += '?api_key=' + cfg.apiKey;
    }
    return url;
}

function createRequest(params) {
    return {
        url: params && params.url || undefined, // to be assigned
        json: params && params.json || undefined, // to be assigned
        headers: {
            'X-AppId': process.env.BILLOMAT_APP_ID,
            'X-AppSecret': process.env.BILLOMAT_APP_SECRET
        }
    }
}

/**
 * promise to make request to Billomat and to return body
 * promise is resolved with body if returned status code was correct
 * otherwise promise is rejected
 */
function promiseResponse(method, requestOptions) {

    return Q.nfcall(request[method], requestOptions).spread(processResponse);

    function processResponse(response, body) {
        if (!~[200, 201].indexOf(response.statusCode)) {
            throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
        }
        return body;
    }
}

exports.getUrl = getUrl;
exports.createRequest = createRequest;
exports.promiseResponse = promiseResponse;



