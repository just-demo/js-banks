// let Parser = require('node-dbf');
let Parser = require('dbf-parser');
// let Parser = require('node-dbf');

['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex'].forEach(encoding => {
console.log('========================', encoding, '===============================');

let parser = new Parser('RCUKRU.DBF', {encoding: encoding});

parser.on('start', (p) => {
    console.log('dBase file parsing has started');
});

parser.on('header', (h) => {
    console.log('dBase file header has been parsed');
});

let first = true;
parser.on('record', (record) => {
    if (first) {
        console.log('Record: ', record.SHORTNAME);
        first = false;
    }
});

parser.on('end', (p) => {
    console.log('Finished parsing the dBase file');
});

parser.parse();

});