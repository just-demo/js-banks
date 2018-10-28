let Parser = require('node-dbf').default;
let iconv = require('iconv-lite');
// import Parser from 'node-dbf'
// let Parser = require('dbf-parser');

let parser = new Parser('/home/pc/Downloads/RCUKRU.DBF', {encoding: 'binary'});

const banks = [];
parser.on('record', (record) => {
    banks.push({
        shortName: decode(record.SHORTNAME),
        fullName: decode(record.FULLNAME)
    });
});

parser.on('end', () => {
    console.log(JSON.stringify(banks));
});

parser.parse();

function decode(value) {
    return iconv.decode(iconv.encode(value, 'binary'), 'cp866')
        .replace(/Ї/g, 'Є')
        .replace(/°/g, 'Ї')
        .replace(/∙/g, 'ї')
        .replace(/Ў/g, 'І')
        .replace(/ў/g, 'і');
}