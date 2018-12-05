import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Scale from './Scale';
import t from './test';
import classNames from 'classnames';

class AppRatings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scale: 1,
            banks: [],
            ratings: {}
        };
    }

    componentDidMount() {
        fetch('/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));


        fetch('/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));

        console.log(t.hello());
    }

    render() {
        const start = new Date();
        this.dates = Object.keys(this.state.ratings).sort().reverse();
        this.banks = _.keyBy(this.state.banks.map(bank => {
            const datesIssue = Object.values(bank.dateIssue);
            return {
                id: bank.internal.id.minfin,
                name: bank.name.minfin,
                site: (bank.site.minfin || [])[0],
                link: bank.internal.link.minfin,
                dateOpen: this.projectDate(bank.dateOpen.dbf),
                dateClosed: this.projectDate(bank.dateIssue.pdf),
                dateIssueMin: this.projectDate(_.min(datesIssue)),
                dateIssueMax: this.projectDate(_.max(datesIssue))
            };
        }).filter(bank => bank.name), 'id');

        // Sort by latest rating in reverse order
        const bankIds = Object.keys(this.banks).sort((bankId1, bankId2) => {
            for (const date of this.dates) {
                const dateRating = this.state.ratings[date];
                const diff = this.compare(dateRating[bankId1], dateRating[bankId2]);
                if (diff) {
                    return diff;
                }
            }

            return this.compareBy(this.banks[bankId1], this.banks[bankId2], {
                dateIssueMin: true,
                dateIssueMax: true,
                dateOpen: false,
                dateClosed: true
            });
        }).reverse();

        const r = (
            <div>
                <Scale value={this.state.scale} min={1} max={100} onChange={(scale) => this.setState({scale: scale})}/>
                <table className="banks">
                    <tbody>
                    <tr>
                        <th>&nbsp;</th>
                        <th>&nbsp;</th>
                        {this.dates.map(date => (
                            <th key={date} className="vertical-bottom-to-top">{date}</th>
                        ))}
                    </tr>
                    {bankIds.map(bankId => (
                        <tr key={bankId}>
                            <td><a href={this.banks[bankId].link}>{this.banks[bankId].name}</a></td>
                            <td><a href={this.banks[bankId].site}>{((this.banks[bankId].site || '').match(/\/\/([^/]+)/) || [])[1]}</a></td>
                            {this.dates.map(date => (
                                <td key={date} className={this.classForCell(this.banks[bankId], date)} style={this.styleForCell(this.state.ratings[date][bankId])}>
                                    <div>
                                        {this.state.ratings[date][bankId] || '-'}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );

        console.log('Rendering time:', new Date() - start);

        return r;
    }

    compare(a, b) {
        return _.isUndefined(a) ?
            _.isUndefined(b) ? 0 : -1 :
            _.isUndefined(b) ? 1 :
                a > b ? 1 : a < b ? -1 : 0;
    }

    compareBy(obj1, obj2, fields) {
        for (const field of  Object.keys(fields)) {
            const diff = this.compare(obj1[field], obj2[field]);
            if (diff) {
                return fields[field] ? diff : -diff;
            }
        }
        return 0;
    }

    projectDate(date) {
        if (!date) {
            return date;
        }
        let projected = date;
        for (const d of this.dates) {
            if (d < date) {
                return projected;
            }
            projected = d;
        }
        return projected;
    }

    classForCell(bank, date) {
        return classNames({
            'rating': true,
            'issue': bank.dateIssueMax >= date && date >= bank.dateIssueMin,
            'issue-max': bank.dateIssueMax === date,
            'issue-min': bank.dateIssueMin === date,
            'closed': (bank.dateClosed && date > bank.dateIssueMax) || (bank.dateOpen && date < bank.dateOpen),
            'open': bank.dateOpen && bank.dateOpen === date
        });
    }

    styleForCell(rating) {
        if (!rating) {
            return {};
        }

        // TODO: show range per color matrix with color=from-to
        const max = 5;    // green  - rgb(  0, 128, 0)
        const middle = 3; // yellow - rgb(255, 255, 0)
        const min = 1;    // red    - rgb(255,   0, 0)
        const scale = this.state.scale;
        rating = Math.max(min, Math.min(max, rating)); // truncate
        rating = Math.floor(rating * scale) / scale; // resolution
        const red = rating <= middle ? 255 : this.scale(rating, middle, 255, max, 0);
        const green = rating >= middle ? this.scale(rating, middle, 255, max, 128) : this.scale(rating, min, 0, middle, 255);
        const blue = 0;
        return {backgroundColor: `rgb(${red}, ${green}, ${blue})`};
    }

    scale(key, minKey, minValue, maxKey, maxValue) {
        return Math.round(minValue + (maxValue - minValue) * (key - minKey) / (maxKey - minKey));
    }
}

export default AppRatings;
