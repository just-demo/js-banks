import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'

class AppBankGovList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter: {
                green: true,
                blue: true,
                red: true,
                pink: true,
                orange: true,
                yellow: true,
                brown: true
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
                        <th>Active</th>
                        <th>Site</th>
                        <th><a href="https://bank.gov.ua/control/uk/bankdict/search">RCUCRU.dbf</a></th>
                        <th><a
                            href="https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch">NBU
                            API</a></th>
                        <th><a href="https://bank.gov.ua">bank.gov.ua</a></th>
                        <th><a href="http://www.fg.gov.ua">www.fg.gov.ua</a></th>
                        <th><a href="https://minfin.com.ua">minfin.com.ua</a></th>
                    </tr>
                    {this.state.banks.map(bank => (
                        <tr key={bank.id} style={this.styleForBank(bank)}>
                            {/*TODO: style for active if there is a mismatch*/}
                            <td>{this.allTrue(bank.active) ? 'Yes' : 'No'}</td>
                            {/*TODO: filter out duplicate sites and show source of each site*/}
                            <td>{_.flatten(Object.values(bank.site) || []).map(site => (
                                <p><a href={site}>{site}</a></p>
                            ))}</td>
                            <td>{bank.name.dbf}</td>
                            <td>{bank.name.api}</td>
                            <td>{bank.name.nbu}</td>
                            <td>{bank.name.fund}</td>
                            <td>{bank.name.minfin}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    allTrue(object) {
        // TODO: do really need to specify predicate a function? isn't default enough?
        return _.every(Object.values(object), value => value);
    }

    styleForBank(bank) {
        const colors = {
            dbf: 'red',
            api: 'pink',
            nbu: 'orange',
            fund: 'yellow',
            minfin: 'brown',
        };
        const allNames = Object.keys(colors).length;
        const withNames = Object.keys(bank.name).filter(key => bank.name[key]).length;
        const isTheOnlyMismatch = key => {
            return (withNames === 1 && bank.name[key]) || (withNames === allNames - 1 && !bank.name[key]);
        };

        // TODO: highlight cells instead of rows
        // TODO: take into account filter when determining isTheOnlyMismatch (don't take into account unchecked columns)
        const color = withNames === allNames ? 'green' : colors[_.find(Object.keys(colors), isTheOnlyMismatch)] || 'blue';
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
