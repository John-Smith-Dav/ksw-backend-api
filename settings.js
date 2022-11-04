const projectName="KswChain";        // 项目名字
const interProjectName="KswChain";   // 国际项目名字

module.exports = {
    host: '0.0.0.0', // 服务器监听的IP
    port: 9001, // 服务端口
    mongodb: 'mongodb://ksw:ksw123%24%25%5E@192.168.95.200:27017/ksw_backend', // mongodb连接
    //mongodb: 'mongodb://ksw:123456@localhost:27017/ksw_backend',
    activeAddress: 'kwLP1FfWPhZWbciNQ3RfLmBpwswLjPKcyA',
    usdtGateway: 'kKSpiowSunrqqmj5s7wguB4Wzc11xqFFfs',
    projectName:projectName,             // 项目名字
    interProjectName:interProjectName,   // 国际项目名字
    hmacKey: 'ofcourseistillloveyou',
    gAuthKey:'tnnyxyyEsMGfGEdVdJNyrbhkVU4rxZKV',
    sha256Key:'mytruementormyguidingmoonlight',
    phoneCodeSecret: 'SHGJ2089pu1s2h23',
    signSwitch: false,
    withdraw_limit: {   // 提币限额

    },
    blockchain_url: '',
    client_blockchain_url: '',
    wallet_pass: "",
    btc_gatewayCurrency: "btc",
    eth_gatewayCurrency: "eth",
    ust_gatewayCurrency: "usdt",
    aud_gatewayCurrency: "aud",
    forbidSymbols: {
        'btc':true,
        'ksw':true,
        'xrp':true,
        'rcp':true,
        'adr':true,
        'ads':true,
        'eth':true,
        'etc':true,
        'ust':true,
        'eos':true,
        'bch':true,
        'ltc':true,
        'bnb':true,
        'xmr':true,
        'trx':true,
        'ada':true,
        'xlm':true,
        'okb':true,
        'neo':true,
        'zec':true,
        'btg':true,
    },
    // 日志相关的配置，一般不需要做修改，日志放在logs目录
    logger: {
        program: {
            level: 'info',
            maxFiles: 100,
            maxsize: 1000 * 1000 * 100,
            json: false,
            dirname: process.cwd() + '/logs',
            filename: 'program.log',
            timestamp: function () {
                var nowDate = new Date();
                var result = nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();

                return result;
            },
            formatter: function (options) {
                return options.timestamp() + ' [' + options.level.toUpperCase() + ']: ' + options.message;
            }
        },
        customer: {
            datePattern: '.yyyy-MM-dd',
            level: 'silly',
            json: false,
            dirname: process.cwd() + '/logs',
            filename: 'customer.log',
            timestamp: function () {
                var nowDate = new Date();
                var result = nowDate.toLocaleDateString() + " " + nowDate.toLocaleTimeString();

                return result;
            },
            formatter: function (options) {
                return options.timestamp() + ' [' + options.level.toUpperCase() + ']: ' + options.message;
            }
        }
    }
};
