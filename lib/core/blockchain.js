"use strict";
const RippleAPI = require('ksw-lib').RippleAPI;

let api;

module.exports.work = async function () {
    api = new RippleAPI({
        server: settings.blockchain_url, // Public rippled server hosted by Ripple, Inc.
        timeout: 5000,
    });
    api.on('error', (errorCode, errorMessage) => {
        console.log(errorCode + ': ' + errorMessage);
    });
    api.on('connected', () => {
        console.log('connected');
    });
    api.on('disconnected', (code) => {
        // code - [close code](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent) sent by the server
        // will be 1000 if this was normal closure
        console.log('disconnected, code:', code);
    });
    this.keepAlive();
    while (!api.isConnected()) {
        await tools.sleep(1000);
    }
    // await this.makeSystemAddressIfNeed();
    // await this.makeAdditionalGatewayAddressIfNeed();
    // await this.makeExtAddressIfNeed();
    return api;
}

module.exports.encodeServerSecret = function (server_address) {
    let result = {};
    for (var key in server_address) {
        result[key] = {};
        result[key].address = server_address[key].address;
        result[key].secret = tools.aesEncrypt(server_address[key].secret, settings.wallet_pass);
    }
    return result;
}

module.exports.decodeServerSecret = function (server_address) {
    for (var key in server_address) {
        server_address[key].secret = tools.aesDecrypt(server_address[key].secret, settings.wallet_pass);
    }
    return server_address;
}

module.exports.getApi = function () {
    return api;
}

module.exports.getBalances = async function (address, currency, options = null) {
    let balances = 0;
    try {
        let result = null;
        if (options) {
            result = await api.getBalances(address, options);
        } else {
            result = await api.getBalances(address);
        }
        for (let index = 0; index < result.length; index++) {
            const element = result[index];
            if (element.currency == currency.toUpperCase()) {
                balances += parseFloat(element.value);
            }
        }
    } catch (error) {
        plog.info("getBalances", address, currency, error.toString());
    }
    return balances;
}

module.exports.getBalancesAll = async function (address) {
    return await api.getBalances(address);
}

module.exports.waitForLedgerComfirm = async function (txid) {
    let txJson;
    while (true) {
        try {
            txJson = await api.getTransaction(txid);
            if (txJson.outcome.result != 'tesSUCCESS') {
                return false;
            }
        } catch (error) {
            await tools.sleep(100);
            continue;
        }
        break;
    }
    while (true) {
        let ledgerIndex = await api.getLedgerVersion();
        if ((ledgerIndex - txJson.outcome.ledgerVersion) >= 1) {
            break
        }
        await tools.sleep(100);
    }
    return true;
}

module.exports.checkTxComfirm = async function (txid) {
    let txJson;
    try {
        txJson = await api.getTransaction(txid);
        if (txJson.outcome.result != 'tesSUCCESS') {
            return [false, txJson.outcome.result];
        }
    } catch (error) {
        if (error.message.indexOf("not found") >= 0) {
            return [true, error];
        } else {
            return [false, error];
        }
    }
    let ledgerIndex = await api.getLedgerVersion();
    return [((ledgerIndex - txJson.outcome.ledgerVersion) >= 1), txJson.outcome.result];
}

module.exports.getAccountInfo = async function (address) {
    let result = await api.getAccountInfo(address);
    return result
}

module.exports.rawGetApi = async function () {
    return api;
}

module.exports.keepAlive = async function () {
    while (true) {
        try {
            if (!api.isConnected()) {
                await api.connect();
            }
        } catch (error) {
            plog.error('blockchain keepAlive: ' + error.stack);
        } finally {
            await tools.sleep(5 * 1000);
        }
    }
}

module.exports.createAccount = async function () {
    return api.generateAddress();
}

module.exports.withdraw = async function (to, currency, amount, mones = null) {
    let result = await this.rawWithdraw(this.server_address.total.address, this.server_address.total.secret, to, currency, amount, mones);
    return result;
}

module.exports.gatewaySetting = async function (address, key) {
    let settings = {
        defaultRipple: true,
    };
    let txUnsigned = await api.prepareSettings(address, settings);
    let txSigned = api.sign(txUnsigned.txJSON, key);
    try {
        let result = await api.submit(txSigned.signedTransaction);
        if (result.resultCode == "tesSUCCESS") {
            return {tx: txSigned.id};
        } else {
            plog.error("gatewaySetting " + currency + " FAILED, address: " + address + ", amount: " + amount.toString() + ", " + result.resultCode + ", " + result.resultMessage);
        }
    } catch (error) {
        plog.error(error);
    }
    return null;
}

module.exports.makeTrustLine = async function (gateway, address, key, currency, amount) {
    let trustLine = {
        "currency": currency.toUpperCase(),
        "counterparty": gateway,
        "limit": amount.toString(),
    };
    let txUnsigned = await api.prepareTrustline(address, trustLine);
    plog.info(JSON.stringify(txUnsigned));
    let txSigned = api.sign(txUnsigned.txJSON, key);

    try {
        let result = await api.submit(txSigned.signedTransaction);
        if (result.resultCode == "tesSUCCESS") {
            return {tx: txSigned.id};
        } else {
            plog.error("makeTrustLine " + currency + " FAILED, address: " + address + ", amount: " + amount.toString() + ", " + result.resultCode + ", " + result.resultMessage);
        }
    } catch (error) {
        plog.error(error);
    }
    return null;
}

module.exports.checkTrustGateway = async function (address, gatewaySymbol, gatewayAddr) {
    let result = await api.getBalances(address);
    for (let index = 0; index < result.length; index++) {
        const element = result[index];
        if (element.currency == gatewaySymbol.toUpperCase() && element.counterparty == gatewayAddr) {
            return true;
        }
    }
    return false;
}

module.exports.btcWithdraw = async function (to, amount, memos = null, type = "") {
    let result = await this.gatewayWithdraw(
        this.server_address.btc_gateway.address,
        this.server_address.btc_gateway_bobi.address,
        this.server_address.btc_gateway_bobi.secret,
        to,
        settings.btc_gatewayCurrency,
        amount.toString(),
        memos,
        type
    );
    return result;
}

module.exports.ustWithdraw = async function (to, amount, memos = null, type = "") {
    let result = await this.gatewayWithdraw(
        this.server_address.ust_gateway.address,
        this.server_address.ust_gateway_bobi.address,
        this.server_address.ust_gateway_bobi.secret,
        to,
        settings.ust_gatewayCurrency,
        amount.toString(),
        memos,
        type
    );
    return result;
}

module.exports.ethWithdraw = async function (to, amount, memos = null, type = "") {
    let result = await this.gatewayWithdraw(
        this.server_address.eth_gateway.address,
        this.server_address.eth_gateway_bobi.address,
        this.server_address.eth_gateway_bobi.secret,
        to,
        settings.ust_gatewayCurrency,
        amount.toString(),
        memos,
        type
    );
    return result;
}

module.exports.audWithdraw = async function (to, amount, memos = null, type = "") {
    let result = await this.gatewayWithdraw(
        this.server_address.aud_gateway.address,
        this.server_address.aud_gateway_bobi.address,
        this.server_address.aud_gateway_bobi.secret,
        to,
        settings.aud_gatewayCurrency,
        amount.toString(),
        memos,
        type
    );
    return result;
}

module.exports.gatewayWithdraw = async function (gateway, from, fromPrivateKey, to, currency, amount, memos = null, type = "") {
    let arr = to.split(".");
    let toAddress = arr[0];
    let payTag = arr[1];
    plog.info("gatewayWithdraw " + currency + " to: " + to + ", amount: " + amount + ", tag: " + payTag);

    let payment = {
        source: {
            address: from,
            maxAmount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
                counterparty: gateway,
            }
        },
        destination: {
            address: toAddress,
            amount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
                counterparty: gateway,
            }
        }
    };

    if (memos) {
        payment.memos = [memos];
    }

    plog.info("gatewayWithdraw", JSON.stringify(payment));

    if (payTag) {
        payment.destination.tag = parseInt(payTag);
    }

    let txUnsigned = await api.preparePayment(from, payment);
    let txSigned = api.sign(txUnsigned.txJSON, fromPrivateKey);
    let result = await api.submit(txSigned.signedTransaction);
    if (result.resultCode == "tesSUCCESS") {
        let asset = {};
        asset[currency] = parseFloat(amount);
        if (type == "" || !type) {
            type = "transfer_asset";
        }
        muiltiAssetLog(from, to, asset, "transfer_asset", type, txSigned.id);
        return {tx: txSigned.id};
    } else {
        plog.error("gatewayWithdraw " + currency + " FAILED, to: " + to + ", amount: " + amount + ", tag: " + payTag + ", " + result.resultCode + ", " + result.resultMessage);
    }
    return null;
}

module.exports.rawWithdraw = async function (from, fromPrivateKey, to, currency, amount, memos = null, type = "", sequence = 0) {
    let arr = to.split(".");
    let address = arr[0];
    let payTag = arr[1];
    plog.info("rawWithdraw " + currency + " to: " + to + ", amount: " + amount + ", tag: " + payTag);

    // amount = tools.mulDecimals(amount, 6);

    let payment = {
        source: {
            address: from,
            maxAmount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
            }
        },
        destination: {
            address: address,
            amount: {
                value: amount.toString(),
                currency: currency.toUpperCase(),
            }
        }
    };

    if (memos) {
        payment.memos = [memos];
    }

    plog.info("rawWithdraw", JSON.stringify(payment));

    if (payTag) {
        payment.destination.tag = parseInt(payTag);
    }

    let txUnsigned = await api.preparePayment(from, payment);
    let txSigned = api.sign(txUnsigned.txJSON, fromPrivateKey);
    let result = await api.submit(txSigned.signedTransaction);
    if (result.resultCode == "tesSUCCESS") {
        let asset = {};
        asset[currency] = parseFloat(amount);
        if (type == "" || !type) {
            type = "transfer_asset";
        }
        muiltiAssetLog(from, to, asset, "transfer_asset", type, txSigned.id);
        return {tx: txSigned.id};
    } else {
        plog.error("rawWithdraw " + currency + " FAILED, to: " + to + ", amount: " + amount + ", tag: " + payTag + ", " + result.resultCode + ", " + result.resultMessage);
    }
    return null;
}

module.exports.getOrderbook = async function (address, orderbook, options) {
    let result = await api.getOrderbook(address, orderbook, options);
    return result;
}

module.exports.formatBidsAndAsks = async function (address, orderbook, options) {
    let result = await api.formatBidsAndAsks(address, orderbook, options);
    return result;
}


module.exports.getFee = async function () {
    let result = await api.getFee();
    return result;
}

module.exports.prepareOrder = async function (option, seed, address, instructions = {}){
    // var option = {
    //     "direction": "buy",      buy/sell
    //     "quantity": {
    //         "currency": "USD",       交易货币名称, drops/XRP不用传counterparty，其他必须传
    //         "counterparty": "",      交易货币网关地址
    //         "value": "10"
    //     },
    //     "totalPrice": {
    //         "currency": 'XRP',       支付货币名称，drops/XRP不用传counterparty，其他必须传
    //         "value": "10"            交易总价
    //     },
    // };

    let prepared = await api.prepareOrder(address, Object.assign({}, option), instructions);
    return this.submit(prepared.txJSON, seed);
};

module.exports.submit = async function (txJSON, seed){
    let sign = api.sign(txJSON, seed);
    return api.submit(sign.signedTransaction);
};

module.exports.prepareOrderCancellation = async function (seed, orderSequence, address){
    let OrderCancellation = await api.prepareOrderCancellation(address, {
        orderSequence : orderSequence,
    });
    return this.submit(OrderCancellation.txJSON, seed);
};

module.exports.getOrders = async function (address, option) {
    return await api.getOrders(address, option);
}

module.exports.getTransactions = async function (address, option) {
    return await api.getTransactions(address, option);
}

module.exports.getTransaction = async function (id, option) {
    return await api.getTransaction(id, option);
}

module.exports.preparePayments = async function (option = {}, instructions = {}){
    let {sourceAddress, destAddress, value, seed, currency, counterparty, memos} = Object.assign({
        value : 0.000001,
        memos: [
            {
                "type": "test",
                "format": "text/plain",
                "data": ""
            }
        ]
    }, option);

    const payment = {
        "source": {
            "address": sourceAddress,
            "maxAmount": {
                "value": value.toString(),
                "currency": currency,
            }
        },
        "destination": {
            "address": destAddress,
            "amount": {
                "value": value.toString(),
                "currency": currency,
            }
        },
        memos
    };
    if(currency){
        if(currency != "KSW" && counterparty && api.isValidAddress(counterparty)){
            payment.source.maxAmount.counterparty = counterparty;
            payment.destination.amount.counterparty = counterparty;
        }
    };
    var promise = await api.preparePayment(sourceAddress, payment, instructions);
    return this.submit(promise.txJSON, seed);
};