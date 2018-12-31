import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'

class AppBanks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter: {
                green: true,
                blue: true,
                // red: true,
                pink: true,
                deeppink: true,
                orange: true,
                yellow: true,
                brown: true
            },
            banks: []
        };

        this.sources = [
            {
                type: 'pdf',
                title: 'NBU PDF',
                href: 'https://bank.gov.ua/control/uk/publish/article?art_id=52047',
                color: 'deeppink',
            },
            // {
            //     type: 'dbf',
            //     title: 'RCUCRU.dbf',
            //     href: 'https://bank.gov.ua/control/uk/bankdict/search',
            //     color: 'red',
            // },
            {
                type: 'api',
                title: 'NBU API',
                href: 'https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch',
                color: 'pink',
            },
            {
                type: 'nbu',
                title: 'bank.gov.ua',
                href: 'https://bank.gov.ua',
                color: 'orange',
            },
            {
                type: 'fund',
                title: 'www.fg.gov.ua',
                href: 'http://www.fg.gov.ua',
                color: 'yellow',
            },
            {
                type: 'minfin',
                title: 'minfin.com.ua',
                href: 'https://minfin.com.ua',
                color: 'brown',
            }
        ];

        fetch('/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));
    }

    handleFilterChange(color) {
        const filter = {...this.state.filter};
        filter[color] = !filter[color];
        this.setState({filter});
    }

    render() {
        //TODO: make filter component reusable?
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
                        {this.enabledSources().map(source => (
                            <th><a href={source.href}>{source.title}</a></th>
                        ))}
                    </tr>
                    {this.state.banks.map(bank => (
                        <tr key={bank.id} style={this.styleForRow(bank)}>
                            {/*TODO: style for active if there is a mismatch*/}
                            <td>{this.allTrue(bank.active) ? 'Yes' : 'No'}</td>
                            {/*TODO: filter out duplicate sites and show source of each site*/}
                            <td>
                                {_.flatten(Object.values(bank.site) || []).map(site => (
                                    <p><a href={site}>{this.truncateSite(site)}</a></p>
                                ))}
                            </td>
                            {this.enabledSources().map(source => (
                                <td style={this.styleForCell(bank, source)}>{bank.name[source.type]}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    truncateSite(site) {
        return site.replace(/(?<!:|:\/)\/.*/g, '').replace(/^http(s)?:\/\//, '');
    }

    enabledSources() {
        // TODO: optimize performance
        return this.sources.filter(source => this.state.filter[source.color]);
    }

    allTrue(object) {
        return _.every(Object.values(object));
    }

    styleForCell(bank, currentSource) {
        const enabledSources = this.enabledSources();
        const allNames = enabledSources.length;
        const populatedNames = enabledSources.filter(source => bank.name[source.type]).length;
        const color = populatedNames === allNames || !populatedNames ? 'green' :
            (populatedNames === 1 && bank.name[currentSource.type]) || (populatedNames === allNames - 1 && !bank.name[currentSource.type]) ? currentSource.color :
                (populatedNames === 1 || populatedNames === allNames - 1) ? 'white' : 'blue';
        return {
            backgroundColor: color
        };
    }

    styleForRow(bank) {
        const enabledSources = this.enabledSources();
        const allNames = enabledSources.length;
        const populatedNames = enabledSources.filter(source => bank.name[source.type]).length;
        const color = populatedNames === allNames || !populatedNames ? 'green' : 'white';
        const style = {
            backgroundColor: color
        };

        if (color !== 'white' && !this.state.filter[color]) {
            style.display = 'none';
        }

        return style;
    }
}

export default AppBanks;
