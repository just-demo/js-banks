import React, {Component} from 'react';

const REFRESH_SERVICE = 'http://localhost:3333';

class PageRefresh extends Component {
    constructor(props) {
        super(props);
        this.state = {
            progress: 0,
            error: false
        };
    }

    render() {
        return (
            <div>
                <div style={{margin: 10, marginLeft: 20}}>
                    <button onClick={() => this.handleRefresh()}>Старт</button>
                    <div style={{
                        width: 300,
                        height: 25,
                        border: '1px solid black',
                        display: 'inline-block',
                        margin: 5,
                        marginLeft: 20,
                        position: 'relative',
                        textAlign: 'center'
                    }}>
                        {this.state.progress}%
                        <div style={{
                            width: this.state.progress + '%',
                            height: '100%',
                            backgroundColor: 'skyblue',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: -1
                        }}>&nbsp;</div>
                    </div>
                    <div style={{
                        display: 'inline-block',
                        margin: 5,
                        marginLeft: 20,
                        textAlign: 'center'
                    }}>{this.formatTime(this.state.taken)}</div>
                </div>
                <div style={{color: 'red', marginLeft: 20}}>
                    {this.state.error && 'Сервіс недоступний'}
                </div>
            </div>
        );
    }

    handleRefresh() {
        this.setProgress(0);
        fetch(REFRESH_SERVICE, {method: 'POST'})
            .then(() => {
                console.log('Refreshing...');
                this.setState({error: false})
                // TODO: make result a Promise?
                this.checkResult();
            })
            .catch(() => this.setState({error: true}));
    }

    checkResult() {
        fetch(REFRESH_SERVICE)
            .then(result => result.json())
            .then(result => {
                if (result.progress) {
                    console.log('In progress...', result.progress);
                    if (result.progress.ready) {
                        const taken = result.progress.now - result.progress.start;
                        const total = result.progress.end - result.progress.start;
                        this.setProgress(taken / total, taken);
                    }
                    setTimeout(() => this.checkResult(), 100);
                } else {
                    console.log('Done!', result);
                    this.setProgress(1)
                }
            });
    }

    setProgress(progress, taken) {
        this.setState({
            progress: Math.min(Math.round(progress * 100), progress < 1 ? 99 : 100),
            taken: taken || this.state.taken
        });
    }

    formatTime(time) {
        return time && new Date(time).toISOString().substr(11, 8);
    }
}

export default PageRefresh;
