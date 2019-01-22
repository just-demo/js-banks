import React, {Component} from 'react';
import '../../App.css';
import './PageLogs.css';
import _ from 'lodash';
import logs from '../../node/logs';
import classNames from 'classnames';

class PageLogs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            files: [],
            file: 0,
            requests: []
        };
    }

    logPath(suffix) {
        return '/logs/' + this.logName(suffix);
    }

    logName(suffix) {
        return `log${suffix}.txt`;
    }

    tryLog(suffix) {
        return fetch(this.logPath(suffix), {method: 'HEAD'}).then(response => {
            if (response.status !== 404) {
                this.setState({files: [...this.state.files, suffix]});
                if (suffix < 10) {
                    return this.tryLog(suffix + 1);
                }
            }
        });
    }

    selectLog(suffix) {
        this.setState({file: suffix});
        if (suffix) {
            fetch(this.logPath(suffix))
                .then(log => log.text())
                .then(log => this.setState({requests: logs.parse(log)}));
        }
    }

    componentDidMount() {
        // TODO: use log delays to emulate requests, divide time in dev mode for ease of use
        this.tryLog(1).then(() => this.selectLog(this.state.files.length && 1));
    }

    render() {
        const totalTime = _.sumBy(this.state.requests, 'time');
        return (
            <div>
                <div className="files">
                    {this.state.files.map((file, index) => (
                        <div key={index} className={classNames({
                            file: true,
                            selected: this.state.file === file
                        })} onClick={() => this.selectLog(file)}>{this.logName(file)}</div>
                    ))}
                </div>
                <div>Total time: {this.formatTime(totalTime)}</div>
                <table className="request">
                    <tbody>
                    {this.state.requests.map((request, index) => (
                        <tr key={index}>
                            <td>{index}</td>
                            <td>{request.url}</td>
                            <td>{request.time}</td>
                            <td><div className="time" style={{width: Math.round(request.time / 5)}}>&nbsp;</div></td>
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

export default PageLogs;
