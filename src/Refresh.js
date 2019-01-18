import React, {Component} from 'react';

const REFRESH_SERVICE = 'http://localhost:3333';

class Refresh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            progress: 0
        };
    }

    render() {
        return (
            <div style={{margin: 5, marginLeft: 20}}>
                <button onClick={() => this.handleRefresh()}>Refresh</button>
                <div style={{width: 300, border: '1px solid black', display: 'inline-block', marginLeft: 20}}>
                    <div style={{width: this.state.progress + '%', backgroundColor: 'skyblue'}}>{this.state.progress}%</div>
                </div>
            </div>
        );
    }

    handleRefresh() {
        this.setProgress(0);
        fetch(REFRESH_SERVICE, {method: 'POST'}).then(() => console.log('Refreshing...'));
        // TODO: make result a Promise
        this.checkResult();
        // TODO: fix PDF parsing issue, save as https://github.com/mozilla/pdf.js/issues/10329
        // TODO: fix CORS related issue when fetching data directly from external sites without proxy server
        // urls.download('http://localhost:3333/download/nbu/not-banks/pdf/320779.pdf?url=https://bank.gov.ua/files/Licences_bank/320779.pdf')
        //     .then(pdf => pdfs.parse(pdf))
        //     .then(text => console.log(text));

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

    checkResult() {
        fetch('http://localhost:3333')
            .then(result => result.json())
            .then(result => {
                if (result.progress) {
                    console.log('In progress...', result.progress);
                    if (result.progress.left) {
                        this.setProgress(result.progress.taken / result.progress.total);
                    }
                    setTimeout(() => this.checkResult(), 100);
                } else {
                    console.log('Done!', result);
                    this.setProgress(1)
                }
            });
    }

    setProgress(progress) {
        this.setState({progress: Math.round(progress * 100)});
    }
}

export default Refresh;