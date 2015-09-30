var request = require('request');
var billomat = require('./lib/common/billomat.js');
var path = 'users/myself';

module.exports = verify;

function verify(credentials, cb) {
    if (!credentials.billomatId || !credentials.apiKey) {
        return cb(null, {verified: false});
    }

    var url = billomat.getUrl(credentials, path);

    request.get(billomat.createRequest({
        url: url,
        json: true
    }), onResponse);

    function onResponse(err, res) {
        if (err) {
            return cb(err);
        }
        if (res.statusCode !== 200) {
            if (~[404, 401].indexOf(res.statusCode)) {
                return cb(null, {verified: false});
            }
            return cb(new Error(JSON.stringify(res.body)));
        } else {
            cb(null, {verified: true});
        }
    }
}
