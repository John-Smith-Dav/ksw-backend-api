//获取项目工程里的图片
var fs = require('fs');//引用文件系统模块
var image = require("imageinfo"); //引用imageinfo模块

function readFileList(path, filesList) {
    var files = fs.readdirSync(path);
    files.forEach(function (itm, index) {
        var stat = fs.statSync(path + itm);
        if (stat.isDirectory()) {
            //递归读取文件
            readFileList(path + itm + "/", filesList)
        } else {

            var obj = {};//定义一个对象存放文件的路径和名字
            obj.path = path;//路径
            obj.filename = itm//名字
            filesList.push(obj);
        }

    })

}

function getFileList(path) {
    var filesList = [];
    readFileList(path, filesList);
    return filesList;
}

module.exports.getImageFiles = function (path) {
    var imageList = [];
    getFileList(path).forEach((item) => {
        var ms = image(fs.readFileSync(item.path + item.filename));
        ms.mimeType && (imageList.push(item.filename))
    });
    return imageList;
}