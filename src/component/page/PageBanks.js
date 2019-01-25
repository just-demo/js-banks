import React, {Component} from 'react';
import '../../App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Done from '@material-ui/icons/Done'
import Clear from '@material-ui/icons/Clear'

class PageBanks extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filter: {
                green: true,
                royalblue: true,
                deeppink: true,
                red: true,
                orange: true,
                yellow: true,
                brown: true
            },
            filterActive: false,
            banks: []
        };

        this.sources = [
            {
                type: 'pdf',
                title: 'НБУ PDF',
                href: 'https://bank.gov.ua/control/uk/publish/article?art_id=52047',
                color: 'deeppink',
            },
            {
                type: 'api',
                title: 'НБУ API',
                href: 'https://bank.gov.ua/control/uk/publish/article?art_id=38441973&cat_id=38459171#get_data_branch',
                color: 'red',
            },
            {
                type: 'nbu',
                title: 'НБУ',
                href: 'https://bank.gov.ua',
                color: 'orange',
            },
            {
                type: 'fund',
                title: 'ФГВФО',
                href: 'http://www.fg.gov.ua',
                color: 'yellow',
            },
            {
                type: 'minfin',
                title: 'Міфін',
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

    handleFilterActiveChange = event => {
        this.setState({filterActive: event.target.checked})
    };

    render() {
        const filterNames = {
            green: 'Повний збіг',
            royalblue: 'Неоднозначність',
        };
        this.sources.forEach(source => filterNames[source.color] = source.title);
        //TODO: make filter component reusable?
        return (
            <div>
                <div style={{padding: 10}}>
                {Object.keys(this.state.filter).map(color => (
                    <span key={color} style={{backgroundColor: color, marginRight: 5, padding: 5}}>
                        <input
                            type="checkbox"
                            id={'filter-' + color}
                            checked={this.state.filter[color]}
                            onChange={() => this.handleFilterChange(color)}
                        />
                        <label htmlFor={'filter-' + color}>{filterNames[color]}</label>
                    </span>
                ))}
                </div>
                <table className="banks">
                    <tbody>
                    <tr>
                        <th><input type="checkbox" checked={this.state.filterActive} onChange={this.handleFilterActiveChange}/></th>
                        <th>Сайт</th>
                        {this.enabledSources().map(source => (
                            <th key={source.type}><a href={source.href}>{source.title}</a></th>
                        ))}
                    </tr>
                    {this.state.banks.filter(bank => !this.state.filterActive || this.allTrue(bank.active)).map(bank => (
                        <tr key={bank.id} style={this.styleForRow(bank)}>
                            {/*TODO: style for active if there is a mismatch*/}
                            <td style={{textAlign: 'center'}}>{this.allTrue(bank.active) ? <Done/> : <Clear/>}</td>
                            {/*TODO: filter out duplicate sites and show source of each site*/}
                            <td>
                                {_.uniq(_.flatten(Object.values(bank.site) || [])).map(site => (
                                    <p key={site}><a href={site}>{this.truncateSite(site)}</a></p>
                                ))}
                            </td>
                            {this.enabledSources().map(source => (
                                <td
                                    key={source.type}
                                    style={this.styleForCell(bank, source)}
                                    title={this.ifExceeds(bank.name[source.type], 20)}
                                >
                                {this.truncate(bank.name[source.type], 20)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    truncate(str, length) {
        return str && str.length > length ? str.substring(0, length - 3) + '...' : str;
    }

    ifExceeds(str, length) {
        return str && str.length > length ? str : null;
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
        return (populatedNames === 1 && bank.name[currentSource.type]) || (populatedNames === allNames - 1 && !bank.name[currentSource.type]) ? {
            backgroundColor: currentSource.color
        } : {};
    }

    styleForRow(bank) {
        const enabledSources = this.enabledSources();
        const allNames = enabledSources.length;
        const populatedNames = enabledSources.filter(source => bank.name[source.type]).length;
        const color = populatedNames === allNames || !populatedNames ? 'green' :
            populatedNames === 1 || populatedNames === allNames - 1 ? 'white' : 'royalblue';
        const style = {
            backgroundColor: color
        };

        if (color !== 'white' && !this.state.filter[color]) {
            style.display = 'none';
        }

        return style;
    }
}

export default PageBanks;
