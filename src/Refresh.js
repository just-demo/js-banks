import React, {Component} from 'react';
import Source from './node/data-source/source';
import isNode from 'detect-node';
import urls from './node/urls'
import pdfs from './node/pdfs'

class Refresh extends Component {
    render() {
        return (
            <div style={{margin: 5, marginLeft: 20}}>
                <button onClick={() => this.handleRefresh()}>Refresh</button>
            </div>
        );
    }

    handleRefresh() {
        console.log('Refreshing...', isNode);
        // TODO: fix PDF parsing issue, save as https://github.com/mozilla/pdf.js/issues/10329
        // TODO: fix CORS related issue when fetching data directly from external sites without proxy server
        urls.download('http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf?url=https://bank.gov.ua/files/Licences_bank/320779.pdf')
            .then(pdf => pdfs.parse(pdf))
            .then(text => console.log(text));

        // urls.download('https://bank.gov.ua/files/Licences_bank/320779.pdf')
        //     .then(pdf => pdfs.parse(pdf))
        //     .then(text => console.log(text));
        // const startTime = new Date();
        // const source = new Source();
        // Promise.all([
        //     source.getBanks().then(banks => console.log(banks)),
        //     source.getRatings().then(ratings => console.log(ratings))
        // ]).then(() => console.log('Total time:', new Date() - startTime));
    }
}

export default Refresh;