// let Parser = require('node-dbf').default;
let iconv = require('iconv-lite');
let utils = require('./utils');

let fs = require('fs');

module.exports = {
    parse(file) {
        // TODO: SHORTNAME is prepended with extra text and FULLNAME is empty, using data preparsed with java for now...
        //return utils.fromJson(utils.readFile('../public/dbf.json')).map(record => record.map(value => this.fixCp866Chars(value)));

        // TODO: how to make the Parser read file content instead of file path
        const parser = new DbfParser(file, 'cp866');
        const records = parser.parse();
        utils.writeFile('./tmp/2.json', utils.toJson(records));
    }
};

function DbfParser(filename, encoding) {
    this.encoding = encoding || 'utf-8';

    this.parse = () => {
        const buffer = fs.readFileSync(filename);
        const numberOfRecords = this.parseInt(buffer.slice(4, 8));
        const headerLength = this.parseInt(buffer.slice(8, 10));
        const recordLength = this.parseInt(buffer.slice(10, 12));

        this.fields = [];
        for (let i = 32, iMax = headerLength - 32; i <= iMax; i += 32) {
            this.fields.push(this.parseFieldDesc(buffer.slice(i, i + 32)));
        }

        const records = [this.fields.map(field => field.name)];
        for (let i = 0; i < numberOfRecords; i++) {
            const recordStart = headerLength + i * recordLength;
            const record = this.parseRecord(buffer.slice(recordStart, recordStart + recordLength));
            if (record) {
                records.push(record);
            }
        }

        return records;
    };

    this.parseRecord = (buffer) => {
        const isDeleted = buffer.slice(0, 1).toString() === '*';
        if (isDeleted) {
            return null;
        }

        let shift = 1;
        return this.fields.map(field => this.parseField(field, buffer.slice(shift, (shift += field.length))));
    };

    this.parseField = (field, buffer) => {
        const value = (buffer.toString()).trim();
        switch (field.type) {
            case 'C':
            case 'M':
                return this.parseString(buffer);
            case 'F':
            case 'N':
                return field.decimalCount ? parseFloat(value) : parseInt(value);
            case 'L':
                return this.parseBoolean(value);
            case 'D':
                return this.parseDate(value);
            default:
                return value;
        }
    };

    this.parseBoolean = (str) => {
        switch (str) {
            case 'Y':
            case 'y':
            case 'T':
            case 't':
                return true;
            case 'N':
            case 'n':
            case 'F':
            case 'f':
                return false;
            default:
                return null;
        }
    };

    this.parseString = (buffer) => {
        // TODO: fix conditionally based on encoding
        return this.fixCp866Chars(iconv.decode(buffer, this.encoding).trim());
    };

    this.fixCp866Chars = (str) => {
        return str.replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і');
    };

    this.parseDate = (str) => {
        // TODO: check why LICDATE field is parsed incorrectly (some other field seems to be overlapping...)
        return str ? [str.substring(0, 4), str.substring(4, 6), str.substring(6, 8)].join('-') : null;
    };

    this.parseFieldDesc = (buffer) => {
        return {
            name: buffer.slice(0, 11).toString().replace(/\0+/, ''),
            type: buffer.slice(11, 12).toString(),
            length: this.parseInt(buffer.slice(16, 17)),
            decimalCount: this.parseInt(buffer.slice(17, 18)),
        };
    };

    this.parseInt = (buffer) => {
        return buffer.readIntLE(0, buffer.length);
    };
};
