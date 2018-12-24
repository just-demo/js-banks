import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import regex from './node/regex';

class AppLogs extends Component {
    constructor(props) {
        super(props);
        this.state = {requests: []};
    }

    componentDidMount() {
        // TODO: use log delays to emulate requests, divide time in dev mode for ease of use
        fetch('/logs/log.txt')
            .then(logs => logs.text())
            .then(logs => {
                console.log(logs);
                const requests = logs.split('\n')
                    .map(line => regex.findObject(line, /GET (.*) (\d+)ms/, {url: 1, time: 2}))
                    .filter(line => line)
                    .map(request => {
                        return {
                            url: request.url,
                            time: parseInt(request.time)
                        }
                    });
                this.setState({requests: requests})
            });
    }

    render() {
        const totalTime = _.sumBy(this.state.requests, 'time');
            // _.sum(this.state.requests.map(request => parseInt(request.time)));
        return (
            <div>
                <div>Total time: {this.formatTime(totalTime)}</div>
                <table className="banks">
                    <tbody>
                    {this.state.requests.map((request, index) => (
                        <tr>
                            <td>{index}</td>
                            <td>{request.url}</td>
                            <td>{request.time}</td>
                            <td><div style={{
                                width: Math.round(request.time / 5),
                                backgroundColor: 'skyblue'
                            }}>&nbsp;</div></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    formatTime(time) {
        return new Date(time).toISOString().substr(11, 8);
    }
}

export default AppLogs;
