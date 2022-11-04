const config = require('../config/config');
const http = require('../util/httpClient');
const crypto = require('crypto');
const moment = require('moment');
const apis = require('../config/apis');
const _ = require('lodash');
//const CryptoJS = require('crypto-js');
//const HmacSHA256 = require('crypto-js/hmac-sha256');

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
}

class BaseAPI{
    constructor(option = config.huobi){
        this.option = option;
        this.baseurl = apis.rest.baseurl;
    }

    get_auth() {
        let sign = this.option.trade_password + 'hello, moto';
        let md5 = crypto.createHash('md5').update(sign).digest('hex');//CryptoJS.MD5(sign).toString().toLowerCase();
        let ret = encodeURIComponent(JSON.stringify({
            assetPwd: md5
        }));
        return ret;
    }

    sign_sha(method, path, data) {
        let pars = [];
        for (let item in data) {
            pars.push(item + "=" + encodeURIComponent(data[item]));
        }
        let p = pars.sort().join("&");
        let meta = [method, this.baseurl, path, p].join('\n');
        // console.log(meta);
        let hash = crypto.createHmac('sha256', this.option.secretkey).update(meta).digest('hex');
        let Signature = encodeURIComponent(new Buffer(hash, 'hex').toString('base64'));
        // console.log(`Signature: ${Signature}`);
        p += `&Signature=${Signature}`;
        // console.log(p);
        return p;
    }

    get_body() {
        return {
            AccessKeyId: this.option.access_key,
            SignatureMethod: "HmacSHA256",
            SignatureVersion: 2,
            Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
        };
    }

    async call_api(method, path, param) {
        return new Promise((resolve, reject) => {
            let account_id = this.option.account_id_pro;
            let body = this.get_body();
            _.assign(body, param);
            let payload = this.sign_sha(method, path, body);
            let url = `https://${this.baseurl}${path}?${payload}`;
            console.log(url);
            let headers = DEFAULT_HEADERS;
            headers.AuthData = this.get_auth();

            if (method == 'GET') {
                http.get(url, {
                    timeout: 1000,
                    headers: headers
                }).then(data => {
                    let json = JSON.parse(data);
                    if (json.status == 'ok') {
                        //console.log(json.data);
                        resolve(json.data|| json.tick);
                    } else {
                        console.log('调用错误', json);
                        reject(null);
                    }
                }).catch(ex => {
                    console.log(method, path, '异常', ex);
                    reject(ex);
                });
            } else if (method == 'POST') {
                http.post(url, body, {
                    timeout: 1000,
                    headers: headers
                }).then(data => {
                    let json = JSON.parse(data);
                    if (json.status == 'ok') {
                        //console.log(json.data);
                        resolve(json.data|| json.tick);
                    } else {
                        console.log('调用错误', json);
                        reject(null);
                    }
                }).catch(ex => {
                    console.log(method, path, '异常', ex);
                    reject(ex);
                });
            }
        });
    }
}

module.exports = BaseAPI;