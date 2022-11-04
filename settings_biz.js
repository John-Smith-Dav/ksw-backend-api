module.exports = {
        port: 9001,	// 服务器监听端口
        blockchain_url: 'ws://gskwin.com:6008',		// 服务器自己连接的xrp链url
        client_blockchain_url: 'ws://gskwin.com:6008',// 发给客户端用的xrp链url
        wallet_pass: '4Klc6IQuhQuvGSyj',	// 系统地址解密秘钥
        //mongodb: 'mongodb://ksw:123456@localhost:27017/ksw_backend', // mongodb连接
        mongodb: 'mongodb://ksw:ksw123%24%25%5E@192.168.95.200:27017/ksw_backend', // mongodb连接
        admin_secret: 'zyZ8JnIwE4hciNjs',	// 管理员接口调用的密码
};

