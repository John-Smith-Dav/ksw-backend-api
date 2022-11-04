const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);

const APIs = {};

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !==basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        let model = require(path.join(__dirname, file));
        APIs[model.name] = model;
    });

module.exports = APIs;