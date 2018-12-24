let iconv = require('iconv-lite');
let utils = require('./utils');
let fs = require('fs');

module.exports = {
    parse(file) {
        const buffer = fs.readFileSync(file);
        const records = new DbfParser('cp866').parse(buffer);
        utils.writeFile('./tmp/2.json', utils.toJson(records));
    }
};

function DbfParser(encoding) {
    this.encoding = encoding || 'utf-8';

    this.parse = (buffer) => {
        const numberOfRecords = this.parseInt(buffer.slice(4, 8));
        const headerLength = this.parseInt(buffer.slice(8, 10));
        const recordLength = this.parseInt(buffer.slice(10, 12));

        const fields = [];
        for (let i = 32, iMax = headerLength - 32; i <= iMax; i += 32) {
            fields.push(this.parseFieldDesc(buffer.slice(i, i + 32)));
        }

        const records = [fields.map(field => field.name)];
        for (let i = 0; i < numberOfRecords; i++) {
            const recordStart = headerLength + i * recordLength;
            const recordBuffer = buffer.slice(recordStart, recordStart + recordLength);
            const recordDeleted = recordBuffer.slice(0, 1).toString() === '*';
            if (!recordDeleted) {
                let shift = 1;
                const record = fields.map(field => this.parseField(field, recordBuffer.slice(shift, (shift += field.length))));
                records.push(record);
            }
        }

        return records;
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
        const str = iconv.decode(buffer, this.encoding).trim();
        return this.encoding === 'cp866' ? this.fixCp866Chars(str) : str;
    };

    this.fixCp866Chars = (str) => {
        return str.replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і');
    };

    this.parseDate = (str) => {
        return str ? [str.substring(0, 4), str.substring(4, 6), str.substring(6, 8)].join('-') : null;
    };

    this.parseFieldDesc = (buffer) => {
        return {
            name: buffer.slice(0, 11).toString().replace(/\0+/, ''),
            type: buffer.slice(11, 12).toString(),
            length: this.parseInt(buffer.slice(16, 18)),
            decimalCount: 0, // TODO: research this.parseInt(buffer.slice(17, 18)),
        };
    };

    this.parseInt = (buffer) => {
        return buffer.readIntLE(0, buffer.length);
    };
}
