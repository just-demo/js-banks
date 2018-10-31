let _ = require('lodash');
let Parser = require('node-dbf').default;
let iconv = require('iconv-lite');
let utils = require('./utils');

module.exports = {
    parse(file) {
        // TODO: SHORTNAME is prepended with extra text and FULLNAME is empty, using data preparsed with java for now...
        return utils.fromJson(utils.readFile('../public/dbf.json')).map(record => record.map(value => this.fixCp866Chars(value)));

        // TODO: how to make the Parser read file content instead of file path
        const parser = new Parser(file, {encoding: 'binary'});
        const records = [];
        parser.on('record', record => records.push(this.decodeCp866Object(record)));
        parser.on('end', () => console.log(records));
        parser.parse();
    },

    decodeCp866Object(inObject) {
        const outObject = {};
        _.forOwn(inObject, (value, key) => outObject[key] = this.decodeCp866Value(value));
        return outObject;
    },

    decodeCp866Value(value) {
        return this.fixCp866Chars(iconv.decode(iconv.encode(value, 'binary'), 'cp866'));
    },

    fixCp866Chars(value) {
        return !_.isString(value) ? value : value
            .replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і');
    }
};