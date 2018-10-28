import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'

class AppDBFList extends Component {
    constructor(props) {
        super(props);
        this.state = {banks: []};
        fetch('/dbf.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));
    }

    render() {
        return (
            <div>
                <table className="banks">
                    <tbody>
                    {this.filter(this.state.banks).map((bank, index) => (
                        <tr>
                            <td>{index}</td>
                            {bank.map(field => (
                                <td style={{whiteSpace: 'nowrap'}}>{field}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    filter(data) {
        // const term = 'Укрексўмбанк'.toLowerCase();
        // return data.filter((row, index) => !index || row.some(cell => ('' + cell).toLowerCase().includes(term)));
        return data;
    }
}

export default AppDBFList;
