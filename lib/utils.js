﻿var fs = require('fs'),
    path = require('path'),
    os = require('os'),
    iconv = require('iconv-lite'),
    _ = require('lodash');

// 创建所有目录
module.exports = {
    mkdirs:function (dirpath, mode, callback) {
        if (typeof mode === 'function') {
            callback = mode;
        }

        fs.exists(dirpath, function (exists) {
            if (exists) {
                callback(dirpath);
            } else {
                //尝试创建父目录，然后再创建当前目录
                module.exports.mkdirs(path.dirname(dirpath), mode, function () {
                    fs.mkdir(dirpath, mode, callback);
                });
            }
        });
    },
    mkdirsSync:function (dirpath, mode) {
        if(!fs.existsSync(dirpath)) {
            //尝试创建父目录，然后再创建当前目录
            module.exports.mkdirsSync(path.dirname(dirpath), mode);
            fs.mkdirSync(dirpath, mode);
        }
    },
    rmdirsSync: function(dirPath){
        var self = this;
        dirPath = path.resolve(dirPath);
        if (!fs.existsSync(dirPath)) {
            return;
        }

        var files = fs.readdirSync(dirPath);

        files.forEach(function(file) {
            var full_p = path.resolve(dirPath, file);
            if (fs.statSync(full_p).isDirectory()) {
                self.rmdirsSync(full_p);
                return;
            }
            fs.unlinkSync(full_p);
        });

        fs.rmdirSync(dirPath);
    },
    startWith: function(str, prefix){
        return str.lastIndexOf(prefix, 0) === 0;
    },
    convertCharset: function(charset){
        charset = charset.toLowerCase();
        if(charset == '' || charset == 'gbk' || charset == 'gb2312' || charset === undefined){
            charset = '';
        }
        return charset;
    },
    writeFileSync: function(filePath, content, charset, append){
        charset = this.parseCharset(charset);
        if(!append && fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
        }
        var fd = fs.openSync(filePath, 'w');
        var comboBuffer = iconv.encode(content, charset);
        fs.writeSync(fd, comboBuffer, 0, comboBuffer.length);
        fs.closeSync(fd);
    },
    parseCharset: function(charset){
        charset = charset.toLowerCase();
        switch (charset){
            case 'utf-8':
            case 'utf8':
            default :
                charset = 'utf8';
                break;
        }
        return charset;
    },
    joinCombo: function(mods){
        var result = [];
        if(!_.isArray(mods)){
            mods = [mods];
        }
        _.forEach(mods, function(mod){
            _.forEach(mod, function(subMods, modName){
                !_.isEmpty(subMods) && result.push("'" + modName + "': { requires: ['" + subMods.join("', '") + "']}");
            });
        });
        return result.length ? "KISSY.config('modules', {" + os.EOL + " " + result.join(", " + os.EOL) + " " + os.EOL + "});" : "";
    },
    isExcluded: function(str, rules){
        var isExcluded = false;
        if(str && _.isArray(rules)){
            _.forEach(rules, function(rule){
                if(new RegExp(rule).test(str)){
                    isExcluded = true;
                    return true;
                }
            });
        }
        return isExcluded;
    },
    addPathSuffix: function(filePath){
        return filePath.replace(/\/$/, '/index.js').replace(/\.js$/, '') + '.js';
    }
};