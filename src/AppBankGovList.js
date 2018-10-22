import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'

class AppBankGovList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter: {
                red: true,
                green: true,
                orange: true,
                yellow: true
            },
            banks: []
        };

        fetch('/banks.gov.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));
    }

    handleFilterChange(color) {
        const filter = {...this.state.filter}
        filter[color] = !filter[color];
        this.setState({filter});
    }

    render() {
        //TODO: make filter component reusable
        return (
            <div>
                {Object.keys(this.state.filter).map(color => (
                    <span style={{backgroundColor: color, marginRight: 5, padding: 5}}>
                        <input
                            type="checkbox"
                            id={'filter-' + color}
                            checked={this.state.filter[color]}
                            onChange={() => this.handleFilterChange(color)}
                        />
                        <label htmlFor={'filter-' + color}>{color}</label>
                    </span>
                ))}
                <table className="banks">
                    <tbody>
                    <tr>
                        <th><a href="https://bank.gov.ua">bank.gov.ua</a></th>
                        <th><a href="http://www.fg.gov.ua">www.fg.gov.ua</a></th>
                    </tr>
                    {this.state.banks.map(bank => (
                        <tr key={bank.id} style={this.styleForBank(bank)}>
                            <td>{bank.bg}</td>
                            <td>{bank.fg}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    styleForBank(bank) {
        let color;
        if (bank.bg === bank.fg) {
            color = 'green';
        } else if (bank.bg && bank.fg) {
            color = 'yellow';
        } else if (bank.bg) {
            color = 'red';
        } else {
            color = 'orange';
        }

        const style = {
            backgroundColor: color
        };

        if (!this.state.filter[color]) {
            style.display = 'none';
        }

        return style;
    }
}

export default AppBankGovList;
