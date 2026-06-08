import React, {Component} from 'react';
import '../../App.css';
import _ from 'lodash';
import logs from '../../node/logs';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

class PageLogs extends Component {
    constructor(props) {
        super(props);
        this.maxNumber = 3;
        this.state = {
            files: [],
            fileIndex: 0,
            requests: []
        };
    }

    logPath(file) {
        return '/logs/' + file;
    }

    tryLog(number) {
        const file = number + '.txt';
        return fetch(this.logPath(file), {method: 'HEAD'}).then(response => {
            if (response.status !== 404) {
                this.setState({files: [...this.state.files, file]});
                if (number < this.maxNumber) {
                    return this.tryLog(number + 1);
                }
            }
        });
    }

    selectFile(fileIndex) {
        this.setState({fileIndex});
        fetch(this.logPath(this.state.files[fileIndex]))
            .then(log => log.text())
            .then(log => this.setState({requests: logs.parse(log)}));
    }

    componentDidMount() {
        // TODO: use log delays to emulate requests, divide time in dev mode for ease of use
        this.tryLog(1).then(() => this.state.files.length && this.selectFile(0));
    }

    render() {
        const {fileIndex} = this.state;
        const totalTime = _.sumBy(this.state.requests, 'time');

        return (
            <div>
                <AppBar position="static">
                    <Tabs value={fileIndex} onChange={(event, fileIndex) => this.selectFile(fileIndex)}
                          style={{backgroundColor: 'white', color: 'black'}}>
                        {this.state.files.map(file => (
                            <Tab key={file} label={file}/>
                        ))}
                    </Tabs>
                </AppBar>
                <div style={{padding: 10}}>Сумарний час: {this.formatTime(totalTime)}</div>
                <table className="request">
                    <tbody>
                    {this.state.requests.map((request, index) => (
                        <tr key={index}>
                            <td>{index}</td>
                            <td>{request.url}</td>
                            <td>{request.time}</td>
                            <td>
                                <div style={{
                                    backgroundColor: 'skyblue',
                                    width: Math.round(request.time / 5)
                                }}>&nbsp;</div>
                            </td>
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
