"use strict";

const decimal = require('decimal.js');
const rp = require('request-promise');
const PriceCurveUSDTModel = require(ROOT + '/lib/core/models/price_curve_usdt.js');
const activityPeriodTime = 120000;  // n秒钟内用户报单少于m笔，持续k个周期的N毫秒定义，暂时设定为2分钟
const activityMinOrderCount = 2;  // n秒钟内用户报单少于m笔，持续k个周期的M定义
const orderRodomQuality = 50;       // 机器人创建订单的随机数base
const robotMaxOrderCount = 10;      // 机器人最大报单数量
const activeAddress = settings.activeAddress;
const usdtGateway = settings.usdtGateway;    // USDT 网关
const kswQuoteUrl = "http://192.168.0.200:9003/service/quote?name=ksw";

/**
 * 曲线周期间隔
 * @return {number}
 */
function curvePeriod() {
    // 曲线周期间隔3000 + 随机数 毫秒
    return 3000 + Math.ceil(Math.random()*10000);
}

/**
 * 启动机器人交易方法
 * @param price 价格
 * @param tick
 * @param rightCurrency USDT
 * @return {Promise<void>}
 */
async function makeAutoTrade(price, tick, rightCurrency) {
    // 循环机器人做深度
    for (let j = 0; j < global.ROBOT_ARRAY.length; j++) {
        let robot = global.ROBOT_ARRAY[j];
        // 查询机器人余额，如果余额不足，从对手方转入
        if (robot.direct == "sell") {
            let kswBalance = await global.blockchain.getBalances(robot.account, "KSW");
            if (kswBalance <= 1000) {
                await moveKswToSell(robot);
                await tools.sleep(4000);
            }
        } else {
            let rightCurrencyBalance = await global.blockchain.getBalances(robot.account, rightCurrency);
            if (rightCurrencyBalance <= 0) {
                await moveCurrencyToBuy(robot, rightCurrency);
                await tools.sleep(4000);
            }
        }
        // 机器人创建订单
        await createOrder(robot.direct, robot, rightCurrency, price, tick);
        await tools.sleep(4000);
    }
}

/**
 * 创建机器人订单，数量随机
 * @param direct
 * @param robot
 * @param rightCurrency
 * @param price
 * @param tick
 * @return {Promise<void>}
 */
async function createOrder(direct, robot, rightCurrency, price , tick) {
    let tradePrice = await makerPrice(rightCurrency, price, tick);
    let quantity = Math.ceil(Math.random()*orderRodomQuality).toFixed(0);
    await createPayment(direct, rightCurrency, quantity, decimal.mul(tradePrice, quantity), robot.seed, robot.account);
}

/**
 * 由于卖ksw不足，需要买方把ksw转回去
 * @return {Promise<void>}
 */
async function moveKswToSell (sellRobot) {
    let buyRobot5 = global.ROBOT_ARRAY[4];
    let buyRobot6 = global.ROBOT_ARRAY[5];
    let buyRobot7 = global.ROBOT_ARRAY[6];
    let buyRobot8 = global.ROBOT_ARRAY[7];
    let kswBalance5 = await global.blockchain.getBalances(buyRobot5.account, "KSW");
    let kswBalance6 = await global.blockchain.getBalances(buyRobot6.account, "KSW");
    let kswBalance7 = await global.blockchain.getBalances(buyRobot7.account, "KSW");
    let kswBalance8 = await global.blockchain.getBalances(buyRobot8.account, "KSW");
    let maxKsw = Math.max(kswBalance5, kswBalance6, kswBalance7, kswBalance8);
    let buyRobot;
    if (maxKsw == kswBalance5) {
        buyRobot = buyRobot5;
    }
    if (maxKsw == kswBalance6) {
        buyRobot = buyRobot6;
    }
    if (maxKsw == kswBalance7) {
        buyRobot = buyRobot7;
    }
    if (maxKsw == kswBalance8) {
        buyRobot = buyRobot8;
    }
    let option = {
        sourceAddress: buyRobot.account,
        destAddress: sellRobot.account,
        value : decimal.mul(maxKsw, 0.8).toNumber().toFixed(0),
        seed: buyRobot.seed,
        currency: "KSW"
    };
    try {
        let result = await global.blockchain.preparePayments(option);
        plog.info("卖机器人KSW余额不足，对手方互转");
    } catch(e) {
        plog.info(e.message);
    }
}

async function moveCurrencyToBuy (buyRobots, rightCurrency) {
    let counterparty = usdtGateway;
    let sellRobot1 = global.ROBOT_ARRAY[0];
    let sellRobot2 = global.ROBOT_ARRAY[1];
    let sellRobot3 = global.ROBOT_ARRAY[2];
    let sellRobot4 = global.ROBOT_ARRAY[3];
    let balance1 = await global.blockchain.getBalances(sellRobot1.account, rightCurrency);
    let balance2 = await global.blockchain.getBalances(sellRobot2.account, rightCurrency);
    let balance3 = await global.blockchain.getBalances(sellRobot3.account, rightCurrency);
    let balance4 = await global.blockchain.getBalances(sellRobot4.account, rightCurrency);
    let max = Math.max(balance1, balance2, balance3, balance4);
    let sellRobot;
    if (max == balance1) {
        sellRobot = sellRobot1;
    }
    if (max == balance2) {
        sellRobot = sellRobot2;
    }
    if (max == balance3) {
        sellRobot = sellRobot3;
    }
    if (max == balance4) {
        sellRobot = sellRobot4;
    }
    let option = {
        sourceAddress: sellRobot.account,
        destAddress: buyRobots.account,
        value : decimal.mul(max, 0.8).toNumber().toFixed(0),
        seed: sellRobot.seed,
        currency: rightCurrency,
        counterparty: counterparty
    };
    try {
        let result = await global.blockchain.preparePayments(option);
        plog.info("买机器人" + rightCurrency + "不足，对手方互转 ");
    } catch(e) {
        plog.info(e.message);
    }

}

/**
 * 创建Payment
 * @param sellBuyType 买卖方向 buy,sell
 * @param rightCurrency 标的货币比如USDT
 * @param quantity  数量
 * @param totalPrice  以标的货币为单位的总价格
 * @param robotSeed 私钥
 * @param robotAddress 地址
 * @return {Promise<boolean>}
 */
async function createPayment(sellBuyType, rightCurrency, quantity, totalPrice, robotSeed, robotAddress) {
    let left = new Object();
    left.currency = "KSW";
    let right = new Object();
    right.counterparty = usdtGateway;    // USDT 网关
    right.currency = rightCurrency;

    try {
        let fee = await global.blockchain.getFee();

        let option = {
            direction: sellBuyType,
            quantity: Object.assign({}, left, {
                value: quantity.toString(),
            }),
            totalPrice: Object.assign({}, right, {
                value: totalPrice.toString(),
            }),
        };
        let data = await global.blockchain.prepareOrder(option, robotSeed, robotAddress, {fee: fee});

        if(data.engine_result_code == 0){
            plog.info("机器人：" + robotAddress + ", 创建成功 data = " +  JSON.stringify(data));
            return true;
        } else {
            plog.info(data.engine_result_message);
            throw new Error(data.engine_result_message);
        }
    } catch(e) {
        plog.info(e.message);
    }
    return false;
}

/**
 * 得到做市价
 * @param desPrice 目标价
 */
async function makerPrice (rightCurrency,desPrice,tick) {
    // 做市价=（成交价 + 目标价）/ 2 + ((x 内随机数 - x/2)* Tick）
    let dealPrice = await getDealPrice(rightCurrency);
    let random = Math.ceil(Math.random()*2);
    let wat = decimal.sub(random, (decimal.div(random,2).toFixed(0))).mul(tick);
    let makePrice = decimal.add(dealPrice , desPrice).div(2).add(wat);
    let dec = 2;    // 小数位数
    if (rightCurrency == "USDT") {
        dec = 4;
    } else {
        dec = 8;
    }
    plog.info("makePrice: " + makePrice.toNumber().toFixed(dec));
    return makePrice.toNumber().toFixed(dec);
}

/**
 * 得到成交价
 * @param rightCurrency
 * @return {Promise<number>}
 */
async function getDealPrice(rightCurrency) {
    let usdtRes = await rp({
        uri: encodeURI(kswQuoteUrl),
        method: 'GET',
        json: true,
    });
    let price = 0;
    let found = false;
    let quote = usdtRes['data'];
    for (const plateName in quote) {
        const plates = quote[plateName];
        if (plates["ksw"]) {
            for (let index = 0; index < plates["ksw"].length; index++) {
                const market = plates["ksw"][index];
                if (market.left.currency.toLowerCase() == "ksw" && market.right.currency == rightCurrency) {
                    price = parseFloat(market.price);
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            break;
        }
    }
    return price;
}

function getOrderOption(rightCurrency) {
    let result = {};
    let left = {};
    let right = {};
    left.currency = "KSW";
    right.currency = rightCurrency;
    right.counterparty = usdtGateway;    // USDT 网关
    result.left = left;
    result.right = right;
    return result;
}

/**
 * 取得当前除了机器人的活跃度
 * @param rightCurrency
 * @return {Promise<{}>}
 */
async function getUserActivityCount(rightCurrency, startTime) {
    // 过滤掉机器人
    let robotBuy = global.ROBOT_ARRAY;
    let robotArray = new Array();
    for (let i = 0; i < robotBuy.length; i++) {
        let item = robotBuy[i];
        robotArray.push(item.account);
    }
    // 取产生订单的非机器人用户
    let userAddressArray = [];
    let option = getOrderOption(rightCurrency);
    let data = await global.blockchain.getOrderbook(activeAddress, {
        base: Object.assign({}, option.left),
        counter: Object.assign({}, option.right),
    }, {limit: 1000});

    for (let i = 0; i < data.bids.length; i++) {
        let item = data.bids[i];
        if (robotArray.indexOf(item.data.Account) < 0 && userAddressArray.indexOf(item.data.Account) < 0) {
            userAddressArray.push(item.data.Account)
        }
    }
    for (let i = 0; i < data.asks.length; i++) {
        let item = data.asks[i];
        if (robotArray.indexOf(item.data.Account) < 0 && userAddressArray.indexOf(item.data.Account) < 0) {
            userAddressArray.push(item.data.Account)
        }
    }
    // 循环用户地址取出用户的transactions
    let userCount = 0;
    for (let i = 0; i < userAddressArray.length; i++) {
       let trans =  await global.blockchain.getTransactions(userAddressArray[i], {
            binary : false,
            excludeFailures : true,
            earliestFirst : true,
            initiated : true,
            types : ['order'],
            limit : 500,
        });
        for (let j = 0; j < trans.length; j++) {
            let item = trans[j];
            // 取出大于开始时间段的order数量
            let timestamp = item.outcome.timestamp;
            if (Date.parse(timestamp) >= Date.parse(startTime)) {
                userCount = decimal.add(userCount,1);
                break;
            }
        }
    }

    return userCount;
}

/**
 * 机器人吃自己的单子
 * @param i
 * @param rightCurrency
 * @param priceCurve
 * @param execFlag 是否利用周期执行，如果为true不利用周期执行，否则每3个曲线周期执行吃单操作
 * @return {Promise<void>}
 */
async function extracted(i, rightCurrency, priceCurve, execFlag) {
    if (decimal.add(i, 1) % 3 === 0 || execFlag) {
        // 取得(做市价 - 成交价) >0 的卖单,补上买单
        let dealPrice = await getDealPrice(rightCurrency);
        if (decimal.sub(priceCurve.price, dealPrice) > 0) {
            let data = await global.blockchain.getOrderbook(activeAddress,
                {
                    base: Object.assign({}, getOrderOption(rightCurrency).left),
                    counter: Object.assign({}, getOrderOption(rightCurrency).right),
                },
                {limit: 1000});
            for (let k = 0; k < data.asks.length; k++) {
                let item = data.asks[k];
                let orderPrice = item.properties.makerExchangeRate;
                if ((orderPrice <= priceCurve.price) && isRobotOrder(item)) {
                    let random = global.ROBOT_ARRAY[parseInt(Math.random() * 4 + 4, 10)];
                    await createPayment("buy", rightCurrency, item.specification.quantity.value, item.specification.totalPrice.value, random.seed, random.account);
                    plog.info("机器人吃掉自己穿价单子：" + execFlag)

                    let rightCurrencyBalance = await global.blockchain.getBalances(random.account, rightCurrency);
                    if (rightCurrencyBalance <= 0) {
                        // 余额不够，从买方机器人转
                        await moveCurrencyToBuy(random, rightCurrency);
                    }
                    await tools.sleep(4000);
                }
            }
        } else {
            let data = await global.blockchain.getOrderbook(activeAddress,
                {
                    base: Object.assign({}, getOrderOption(rightCurrency).left),
                    counter: Object.assign({}, getOrderOption(rightCurrency).right),
                },
                {limit: 1000});
            for (let k = 0; k < data.bids.length; k++) {
                let item = data.bids[k];
                let digit = 8;
                if (rightCurrency == "USDT") {
                    digit = 4;
                }
                let orderPrice = decimal.div(1, item.properties.makerExchangeRate).toNumber().toFixed(digit);
                if ((orderPrice >= priceCurve.price) && isRobotOrder(item)) {
                    let random = global.ROBOT_ARRAY[parseInt(Math.random() * (4), 10)];
                    await createPayment("sell", rightCurrency, item.specification.quantity.value, item.specification.totalPrice.value, random.seed, random.account);
                    plog.info("机器人吃掉自己穿价单子：" + execFlag)

                    let kswBalance = await global.blockchain.getBalances(random.account, "KSW");
                    if (kswBalance <= 1000) {
                        // 余额不够，从买方机器人转
                        await moveKswToSell(random);
                    }
                    await tools.sleep(4000);
                }
            }
        }
    }
}

async function commonWork(rightCurrency) {
    try {
        let priceCurveArray = await PriceCurveUSDTModel.find({"isUse": {"$ne": true}}).sort({"seq": 1});
        let tick = 0.0001;
        for (let i = 0; i < priceCurveArray.length; i++) {
            if (!global.usdtRobotStartFlag) {
                break;
            }
            let priceCurve = priceCurveArray[i];
            //const activityPeriod = 5;    // n秒钟内用户报单少于m笔，持续k个周期的K定义
            // const activitySecond = 60;  // n秒钟内用户报单少于m笔，持续k个周期的N秒定义
            // const activityOrderCount = 2;  // n秒钟内用户报单少于m笔，持续k个周期的M定义
            let activityTime = new Date().toISOString();
            if ((Date.parse(activityTime) - Date.parse(global.activityTimeUtc)) >= activityPeriodTime) {
                // 超过2分钟查询用户活跃度
                let activityOrder = await getUserActivityCount(rightCurrency, global.activityTimeUtc);
                if (activityOrder > activityMinOrderCount) {
                    await extracted(i, rightCurrency, priceCurve, true);
                    global.activityFlag = true;
                } else {
                    global.activityFlag = false;
                }
                global.activityTimeUtc = activityTime;
            }
            if (global.activityFlag) {
                break;
            }

            console.log("曲线目前价格：" + priceCurve.price);

            // TODO
            /*while (true) {
                try {
                    let data = await global.blockchain.getOrderbook(activeAddress,
                        {
                            base: Object.assign({}, getOrderOption("USDT").left),
                            counter: Object.assign({}, getOrderOption("USDT").right),
                        },
                        {limit: 500});
                } catch (e) {
                    console.log(e.message)
                }
            }*/

            await makeAutoTrade(priceCurve.price, tick, rightCurrency);

            // 客户穿价处理
            while(!await customerBeatSellOrder(priceCurve.price, rightCurrency, tick));

            while(!await customerBeatBuyOrder(priceCurve.price, rightCurrency, tick));

            // 吃掉机器人自己的穿价单子
            await extracted(i, rightCurrency, priceCurve, false);

            // 更新数据库
            if (rightCurrency == "USDT") {
                await PriceCurveUSDTModel.updateOne({seq: priceCurve.seq}, {$set:{isUse: true}}, {'upsert': true});
            }
            await tools.sleep(curvePeriod());
        }

    } catch (e) {
        plog.info("tradeRobot err:" + e);
    } finally {
        await tools.sleep(4000);

    }
}

/**
 * 是否机器人订单判断
 * @param ask
 * @return {boolean}
 */
function isRobotOrder(ask) {
    let robotArray = new Array();
    for (let j = 0; j < global.ROBOT_ARRAY.length; j++) {
        robotArray.push(global.ROBOT_ARRAY[j].account);
    }
    if (robotArray.indexOf(ask.data.Account) > -1) {
        // 是机器人的单子
        return true;
    }
    return false;
}

/**
 * 递归吃掉客户穿价单子
 * @param curvePrice
 * @param rightCurrency
 * @param tick
 * @return {Promise<boolean>}
 */
async function customerBeatSellOrder(curvePrice, rightCurrency, tick) {
    let allEatOverFlag = true;
    if (!global.usdtRobotStartFlag) {
        return true;
    }
    let data = await global.blockchain.getOrderbook(activeAddress,
        {
            base: Object.assign({}, getOrderOption(rightCurrency).left),
            counter: Object.assign({}, getOrderOption(rightCurrency).right),
        },
        {limit: 500});

    // 如果出现客户单子且卖单穿价
     for (let j = 0; j < data.asks.length; j++) {
         try {
             let item = data.asks[j];
             // 取得最小穿价的客户单子
             if ((!isRobotOrder(item) && item.properties.makerExchangeRate < curvePrice)) {
                 // 把低价卖KSW的单子慢慢吃掉
                 let buyRobot = global.ROBOT_ARRAY[parseInt(Math.random() * 4 + 4, 10)];
                 let makerExchangeRate = decimal.add(item.properties.makerExchangeRate, tick);
                 let quantity, totalPrice;
                 if (item.specification.quantity.value < 500) {
                     quantity = item.specification.quantity.value;
                 } else {
                     quantity = Math.ceil(Math.random() * 500);
                 }
                 totalPrice = decimal.mul(quantity, makerExchangeRate);
                 let rightCurrencyBalance = await global.blockchain.getBalances(buyRobot.account, rightCurrency);
                 if (rightCurrencyBalance <= 0) {
                     // 余额不够，从买方机器人转
                     await moveCurrencyToBuy(buyRobot, rightCurrency);
                     await tools.sleep(3000);
                 }
                 await createPayment("buy", rightCurrency, quantity, totalPrice.toNumber(), buyRobot.seed, buyRobot.account);
                 plog.info("客户卖单穿价，吃单: curvePrice=" + curvePrice + ",customerPrice=" + item.properties.makerExchangeRate)
                 allEatOverFlag = false;
                 await tools.sleep(4000);
             }
         } catch (e) {
             plog.info("无法吃单" + e.message)
         }
    }
    return allEatOverFlag;
}

/**
 * 递归吃掉客户穿价单子
 * @param curvePrice
 * @param rightCurrency
 * @param tick
 * @return {Promise<boolean>}
 */
async function customerBeatBuyOrder(curvePrice, rightCurrency, tick) {
    let allEatOverFlag = true;
    if (!global.usdtRobotStartFlag) {
        return true;
    }
    let data = await global.blockchain.getOrderbook(activeAddress,
        {
            base: Object.assign({}, getOrderOption(rightCurrency).left),
            counter: Object.assign({}, getOrderOption(rightCurrency).right),
        },
        {limit: 500});
    // 如果出现客户单子且买单穿价
    for (let j = 0; j < data.bids.length; j++) {
        let item = data.bids[j];
        let digit = 4;
        try {
            let realPrice = decimal.div(1, item.properties.makerExchangeRate).toNumber().toFixed(digit);
            // 取得最大穿价的客户单子
            if (!isRobotOrder(item) && realPrice > curvePrice) {
                // 把高价买KSW的单子慢慢吃掉
                let sellRobot = global.ROBOT_ARRAY[parseInt(Math.random() * (4), 10)];
                realPrice = decimal.sub(realPrice, tick * 2).toNumber().toFixed(digit);
                let quantity, totalPrice;
                if (item.specification.quantity.value < 500) {
                    quantity = item.specification.quantity.value;
                } else {
                    quantity = Math.ceil(Math.random() * 500);
                }
                totalPrice = decimal.mul(quantity, realPrice);

                let kswBalance = await global.blockchain.getBalances(sellRobot.account, "KSW");
                if (kswBalance <= 1000) {
                    // 余额不够，从买方机器人转
                    await moveKswToSell(sellRobot);
                    await tools.sleep(3000);
                }

                await createPayment("sell", rightCurrency, quantity, totalPrice.toNumber(), sellRobot.seed, sellRobot.account);
                allEatOverFlag = false;
                plog.info("客户买单穿价，吃单: curvePrice=" + curvePrice + ",customerPrice=" + decimal.div(1, item.properties.makerExchangeRate).toNumber().toFixed(digit))
                await tools.sleep(4000);
            }
        } catch (e) {
            plog.info("无法吃单" + e.message)
        }
    }
    return allEatOverFlag;
}

/**
 * 机器人挂单太多，消单
 * @param rightCurrency
 * @return {Promise<{robotSellOrderCnt: number, robotBuyOrderCnt: number}>}
 */
async function robotOrderTooManyDeal(rightCurrency, robot) {
    let data = await global.blockchain.getOrderbook(activeAddress,
        {
            base: Object.assign({}, getOrderOption(rightCurrency).left),
            counter: Object.assign({}, getOrderOption(rightCurrency).right),
        },
        {limit: 5000});
    let robotSellOrderCnt = 0;
    let robotBuyOrderCnt = 0;
    for (let j = 0; j < data.asks.length; j++) {
        let item = data.asks[j];
        if (item.data.Account == robot.account) {
            robotSellOrderCnt = decimal.add(robotSellOrderCnt, 1);
        }
    }

    for (let j = 0; j < data.bids.length; j++) {
        let item = data.bids[j];
        if (item.data.Account == robot.account) {
            robotBuyOrderCnt = decimal.add(robotBuyOrderCnt, 1);
        }
    }
    return {robotSellOrderCnt, robotBuyOrderCnt};

}

async function robotCancalOrder(rightCurrency) {
    try {
        for (let j = 0; j < global.ROBOT_ARRAY.length; j++) {
            let robot = global.ROBOT_ARRAY[j];
            let robotOrder = await robotOrderTooManyDeal(rightCurrency, robot);
            if (robotOrder.robotSellOrderCnt > robotMaxOrderCount) {
                // 如果机器人卖单数量过多，进行撤单
                let data = await global.blockchain.getOrderbook(activeAddress,
                    {
                        base: Object.assign({}, getOrderOption(rightCurrency).left),
                        counter: Object.assign({}, getOrderOption(rightCurrency).right),
                    },
                    {limit: 5000});
                for (let j = data.asks.length - 1; j >= 0; j--) {
                    let item = data.asks[j];
                    if (item.data.Account == robot.account) {
                        let result = await global.blockchain.prepareOrderCancellation(robot.seed, item.data.Sequence, robot.account);
                        console.log("robot 订单过多，取消部分卖订单：robot=" +  JSON.stringify(result));
                        await tools.sleep(4000);
                    }
                }
            }
            if (robotOrder.robotBuyOrderCnt > robotMaxOrderCount) {
                let data = await global.blockchain.getOrderbook(activeAddress,
                    {
                        base: Object.assign({}, getOrderOption(rightCurrency).left),
                        counter: Object.assign({}, getOrderOption(rightCurrency).right),
                    },
                    {limit: 5000});
                for (let j = data.bids.length - 1; j >= 0; j--) {
                    let item = data.bids[j];
                    if (item.data.Account == robot.account) {
                        let result = await global.blockchain.prepareOrderCancellation(robot.seed, item.data.Sequence, robot.account);
                        console.log("robot 订单过多，取消部分买订单：robot=" + JSON.stringify(result));
                        await tools.sleep(4000);
                    }
                }
            }
        }
    } catch (e) {
        console.log("error:" + e.message);
    }

}

module.exports.getOrderOption =  function () {
    return this.getOrderOption();
}

module.exports.cancalOrder = async function () {
    while (true) {
        await tools.sleep(50000);
        await robotCancalOrder("USDT");
    }
}

module.exports.startWork = async function () {
    return commonWork();
}

/*module.exports.workUSDT =  async function () {
    /!*
    while (true) {
        plog.info("usdt tradeRobot start");
        // await commonWork("USDT");
        try {
            let data = await global.blockchain.getOrderbook(activeAddress,
                {
                    base: Object.assign({}, getOrderOption("USDT").left),
                    counter: Object.assign({}, getOrderOption("USDT").right),
                },
                {limit: 500});
            await tools.sleep(4000);
        } catch (e) {
            console.log(e.message)
        }
    }
    *!/

    while (true) {
        // TODO
       /!* let config = {
            "access_key": "f345b77d-38cf6379-4ed78b71-mn8ikls4qg",
            "secretkey": "5df7c9ea-d7f63980-237b0189-a516a",
        }
        let huobi = new Huobi(config);
        let market = await huobi.marketAPI.getTrade('btcusdt');
        console.log(JSON.stringify(market, null, 4));*!/
        // TODO　ｅｎｄ
        plog.info("usdt tradeRobot start");
        await commonWork("USDT");
    }
}*/