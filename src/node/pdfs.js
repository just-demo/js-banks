const pdfjs = require('pdfjs-dist');

module.exports = {
    parse(buffer) {
        return pdfjs.getDocument({data: buffer})
            .then(pdf => pdf.getPage(1))
            .then(page => page.getTextContent())
            .then(text => text.items.map(item => item.str).join(''));
    }
};