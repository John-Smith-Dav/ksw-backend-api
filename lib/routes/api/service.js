"use strict";

require('date-utils');
const Router = require('koa-better-router');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const ServerStatModel = require(ROOT + '/lib/core/models/serverStat.js');
const AdModel = require(ROOT + '/lib/core/models/ad.js');
const PriceModel = require(ROOT + '/lib/core/price.js');
const SwipeImageModel = require(ROOT + '/lib/core/models/swipe_image.js');
const SymbolModel = require(ROOT + '/lib/core/models/symbol.js');
const tradeRobot = require(ROOT + '/lib/core/tradeRobot.js');

const fs = require('fs');
const send = require('koa-send');

const request = require('request')

module.exports = function (app) {
    let routers = new Router();

    /**
     * 获取rcp链相关信息
     */
    routers.get("/service/rcp_info", async (ctx, next) => {
        let result = {
            rcp_ws: settings.client_blockchain_url,                                                // ws地址
           /* btc_gateway_address: 'kHiKiVMGkix4bmv67sKDtuxeU3EB9xZZGa', // btc网关地址
            eth_gateway_address: 'kfLXN4hc1XZsbhuNRYGWcz9WjLCF5TuJDy', // eth网关地址
            ust_gateway_address: 'k3Yz9R9MQdRbMzBygYf8fdjFqt1Rb1XrWf', // usdt网关地址
            invite_address: 'r99SpYzcpwxJEaveHuYMmCD2CsskyRSRpt',      // 激活地址*/
            black_hole_address: 'kKQw8BUBzTmSTssgdomGE877USkbRdLYnL',  // 黑洞地址
            withdraw_address:{
                //'btc':global.blockchain.server_address.btc_withdraw.address,
                //'ust':global.blockchain.server_address.ust_withdraw.address,
                //'eth':global.blockchain.server_address.eth_withdraw.address,
            },
            withdaw_setting: settings.withdaw_setting,                                             // 提币设置，手续费相关
            trade_open_time: true,
        };

        return ctx.responseData(result);
    });

    /**
     * 获取rcp链相关信息
     */
    routers.get("/service/price_info", async (ctx, next) => {
        let result = {
            cny_price: tools.toFixed(await PriceModel.getPrice('ksw', 'cny'), 2),  // 人民币价格
            usd_price: tools.toFixed(await PriceModel.getPrice('ksw', 'usd'), 2),  // 美元价格
            rub_price: tools.toFixed(await PriceModel.getPrice('ksw', 'rub'), 2),  // 卢布价格
            eur_price: tools.toFixed(await PriceModel.getPrice('ksw', 'eur'), 2),  // 欧元价格

            btc_cny_price: tools.toFixed(await PriceModel.getPrice('btc', 'cny'), 2),  // 人民币价格
            btc_usd_price: tools.toFixed(await PriceModel.getPrice('btc', 'usd'), 2),  // 美元价格
            btc_rub_price: tools.toFixed(await PriceModel.getPrice('btc', 'rub'), 2),  // 卢布价格
            btc_eur_price: tools.toFixed(await PriceModel.getPrice('btc', 'eur'), 2),  // 欧元价格

            eth_cny_price: tools.toFixed(await PriceModel.getPrice('eth', 'cny'), 2),  // 人民币价格
            eth_usd_price: tools.toFixed(await PriceModel.getPrice('eth', 'usd'), 2),  // 美元价格
            eth_rub_price: tools.toFixed(await PriceModel.getPrice('eth', 'rub'), 2),  // 卢布价格
            eth_eur_price: tools.toFixed(await PriceModel.getPrice('eth', 'eur'), 2),  // 欧元价格

            usdt_cny_price: tools.toFixed(await PriceModel.rawGetUsdtPrice('cny'), 2),  // 人民币价格
            usdt_usd_price: tools.toFixed(await PriceModel.rawGetUsdtPrice('usd'), 2),  // 美元价格
            usdt_rub_price: tools.toFixed(await PriceModel.rawGetUsdtPrice('rub'), 2),  // 卢布价格
            usdt_eur_price: tools.toFixed(await PriceModel.rawGetUsdtPrice('eur'), 2),  // 欧元价格

            uni_cny_price: tools.toFixed(await PriceModel.getPrice('uni', 'cny'), 2),  // 人民币价格
            uni_usd_price: tools.toFixed(await PriceModel.getPrice('uni', 'usd'), 2),  // 美元价格
            uni_rub_price: tools.toFixed(await PriceModel.getPrice('uni', 'rub'), 2),  // 卢布价格
            uni_eur_price: tools.toFixed(await PriceModel.getPrice('uni', 'eur'), 2),  // 欧元价格
        };

        return ctx.responseData(result);
    });

    /**
     * 获取app相关信息
     */
    routers.get("/service/app_info", async (ctx, next) => {
        let serverStat = await ServerStatModel.findOne({symbol: settings.projectName});
        if (!serverStat) {
            return ctx.responseError("Could not found app info");
        }

        let result = {
            app_android_download: serverStat.app_android_download,
            app_android_version: serverStat.app_android_version,
            app_android_update_desc: serverStat.app_android_update_desc,
            app_ios_download: serverStat.app_ios_download,
            app_ios_version: serverStat.app_ios_version,
            app_ios_update_desc: serverStat.app_ios_update_desc,
            app_update_force: serverStat.app_update_force,
        }

        return ctx.responseData(result);
    });

    routers.get("/service/ad", async (ctx, next) => {
        let lan = ctx.args.lan;
        if (!lan) {
            lan = "zh";
        }
        let ads = await AdModel.find({lan: lan}).sort({time:-1});
        return ctx.responseData(ads);
    });

   /**
     * 取得某个模块需要的图片
     * type:discovery  发现模块
     *     :login      主页
     */
    routers.get("/service/images", async (ctx, next) => {
        let type = ctx.args.type;
        if (!type) {
            return ctx.responseError("模块类型(type)参数为空");
        }
        let data = await SwipeImageModel.findOne({type: type});
        if (!data) {
            return ctx.responseError("图片数据不存在");
        }
        let images = data.image;
        let result= [];
        for (let index = 0; index < images.length; index++) {
            const element = images[index];
            let path = element.path;
            let url = element.url;
            let imageBuf = fs.readFileSync(path);
            let pro = {
                type: element.type,                         // 模块类型
                url: url,
                base64: imageBuf.toString("base64")
            };
            result.push(pro);
        }
        return ctx.responseData(result);
        //return ctx.responseData(optFile.getImageFiles(swipe_path));
    });

    /**
     * 自动更新的文件下载
     */
    routers.get("/service/download", async (ctx, next) => {
        // 下载模块的参数

        let type = ctx.args.type;
        if (!type) {
            return ctx.responseError("模块类型(type)参数为空");
        }
        if (type == 'apk_download') {
            const fileName = 'ksw-wallet.apk'; // 文件名
            const dir = '/usr/local/ksw/images/ksw-wallet.apk';  // 静态资源目录
            try {
                ctx.set('Content-Disposition', 'attachment; filename=' + fileName);
                ctx.attachment(dir);
                await send(ctx, fileName, {root:'/usr/local/ksw/images/'});
            } catch (e) {
                ctx.responseError('no file');
            }
        }
    });

    /**
     * 自动跟单 TODO
     */
    routers.get("/service/control_robot", async (ctx, next) => {
        let currency = ctx.args.currency;
        let stopFlag = ctx.args.stopFlag;

        if (stopFlag == "true" || stopFlag == true) {
            if (currency == "USDT") {
                global.usdtRobotStartFlag = false;
            }
            if (currency == "ETH") {
                global.ethRobotStartFlag = false;
            }
            if (currency == "BTC") {
                global.btcRobotStartFlag = false;
            }
        } else {
            if (currency == "USDT") {
                global.usdtRobotStartFlag = true;
            }
            if (currency == "ETH") {
                global.ethRobotStartFlag = true;
            }
            if (currency == "BTC") {
                global.btcRobotStartFlag = true;
            }
        }

        return ctx.responseData("success");
    });

    /**
     * 机器人余额监控
     */
    routers.get("/service/robot_balance", async (ctx, next) => {
        let robotBuy = global.ROBOT_ARRAY;
        let result = new Array();
        for (let i = 0; i < robotBuy.length; i++) {
            let robotEntity = robotBuy[i];
            let balanceObject = new Object();
            balanceObject.address = robotEntity.account;
            await global.blockchain.getBalancesAll(robotEntity.account).then(data => {
                balanceObject.data = data;
            }).catch(e => {
                console.log(e.message);
            });
            result.push(balanceObject);
        }
        return ctx.responseData(result);
    });

    routers.get("/service/robot_delete_order", async (ctx, next) => {
        let robot = global.ROBOT_ARRAY;
        for (let i = 0; i < robot.length; i++) {
           let data = await global.blockchain.getOrders(robot[i].account, {limit : 80000});
           for (let j = 0; j < data.length; j++) {
               try {
                   await global.blockchain.prepareOrderCancellation(robot[i].seed, data[j].properties.sequence, robot[i].account);
                   console.log("取消订单：" + data[j].properties.sequence);
                   await tools.sleep(1000);
               } catch (e) {
                   console.log(e.message);
               }

           }
        }

        return ctx.responseData("success");
    });

    routers.get("/service/common/symbols", async (ctx, next) => {
        let symbols = await SymbolModel.find({}).sort({symbol:1});
        return ctx.responseData(symbols);
    });

    routers.get("/service/robot_start_order", async (ctx, next) => {
        let currency = ctx.args.currency;
        plog.info(currency + " tradeRobot start");
        tradeRobot.startWork(currency.toUpperCase());
        return ctx.responseData("success");
    });


    routers.get("/service/vote_test", async (ctx, next) => {

        let url = "http://voteapi.mysteel.com/tpgl/startVote"
        let options = {
            method: 'get',
            url: url,
            json: {
                'itemId': '21494',
                'code': '1111',
                'type': '1',
                'timestamp': new Date().getTime(),
                'nonce': "a614a3ae-d4eb-e5f1-2e04-b597cc8778b8",
                'sign': 'FFF5F96FC634D9DD1115D0F5B264F9AB'
            },
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Proxy-Authorization': "Basic cnVpeWluZ2tlamk6NiMhNnBhJHVQSnlW",
                'Accept-Encoding': 'gzip, deflate',

            }
        }
        //
        request(options, function (err, res, body) {
            if (err) {
                console.log(err)
            } else {
                console.log(body)
            }
        })
        return ctx.responseData("success");
    });


    app.use(routers.middleware());
};
