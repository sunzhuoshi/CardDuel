var winston = require('winston');

winston.level = 'debug';

var global = {
    io: null,
    logger: winston
};

if (typeof Object.values === 'undefined') {
    Object.values = function(obj) {
        var values = [];
        Object.keys(obj).forEach((key) => {
            values.push(obj[key]);
        });
        return values;
    }
}

module.exports = global;