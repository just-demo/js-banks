let Parser = require('node-dbf').default;
let iconv = require('iconv-lite');

module.exports = {
    fetchAndExtractDbf() {
        let parser = new Parser('/home/pc/Downloads/RCUKRU.DBF', {encoding: 'binary'});

        const banks = [];
        parser.on('record', (record) => {
            banks.push({
                shortName: this.decode(record.SHORTNAME),
                fullName: this.decode(record.FULLNAME)
            });
        });

        parser.on('end', () => {
            // TODO: shortName is prepended with extra data and fullName is empty, that is why using java parser instead for now...
            console.log(banks);
        });

        parser.parse();
    },

    decode(value) {
        return this.fixChars(iconv.decode(iconv.encode(value, 'binary'), 'cp866'));
    },

    fixChars(value) {
        return value
            .replace(/Ї/g, 'Є')
            .replace(/°/g, 'Ї')
            .replace(/∙/g, 'ї')
            .replace(/Ў/g, 'І')
            .replace(/ў/g, 'і');
    }
};