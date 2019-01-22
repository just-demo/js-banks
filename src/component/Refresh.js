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
    }

    checkResult() {
        fetch('http://localhost:3333')
            .then(result => result.json())
            .then(result => {
                if (result.progress) {
                    console.log('In progress...', result.progress);
                    if (result.progress.ready) {
                        const taken = new Date().getTime() - result.progress.start;
                        const total = result.progress.end - result.progress.start;
                        this.setProgress(taken / total);
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