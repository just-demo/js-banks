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
            banks: {},
            ratings: {}
        };
    }

    convertBanks(banks) {
        return _.keyBy(banks.map(bank => {
            return {
                id: bank.internal.id.minfin,
                name: bank.name.minfin,
                site: (bank.site.minfin || [])[0],
                link: bank.internal.link.minfin,
                dateOpen: bank.dateOpen,
                dateIssue: bank.dateIssue
            };
        }).filter(bank => bank.name), 'id');
    }

    componentDidMount() {
        fetch('/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: this.convertBanks(banks)}));


        fetch('/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));

        console.log(t.hello());
    }

    compare(a, b) {
        return _.isUndefined(a) ?
            _.isUndefined(b) ? 0 : -1 :
            _.isUndefined(b) ? 1 :
                a > b ? 1 : a < b ? -1 : 0;
    }

    render() {
        const start = new Date();
        this.dates = Object.keys(this.state.ratings).sort().reverse();

        const latestRating = {};
        _.forOwn(this.state.ratings, (dateRating, date) => {
            _.forOwn(dateRating, (bankRating, bankId) => {
                if (!latestRating[bankId] || latestRating[bankId].date < date) {
                    latestRating[bankId] = {
                        date: date,
                        rating: bankRating
                    };
                }
            });
        });

        // Sort by latest rating in reverse order
        const bankIds = Object.keys(this.state.banks).sort((bankId1, bankId2) => {
            for (const date of this.dates) {
                const dateRating = this.state.ratings[date];
                const diff = this.compare(dateRating[bankId1], dateRating[bankId2]);
                if (diff) {
                    return diff;
                }
            }
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
                            <td><a href={this.state.banks[bankId].link}>{this.state.banks[bankId].name}</a></td>
                            <td><a href={this.state.banks[bankId].site}>{((this.state.banks[bankId].site || '').match(/\/\/([^/]+)/) || [])[1]}</a></td>
                            {this.dates.map(date => (
                                <td key={date} className={this.classForCell(bankId, date)} style={this.styleForCell(bankId, date)}>
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

    classForCell(bankId, date) {
        // TODO: init or cache projectDate
        const dateOpen = this.projectDate(this.state.banks[bankId].dateOpen.dbf);
        const dateClosed = this.projectDate(this.state.banks[bankId].dateIssue.pdf);
        const datesIssue = Object.values(this.state.banks[bankId].dateIssue);
        const dateIssueMin = this.projectDate(_.min(datesIssue));
        const dateIssueMax = this.projectDate(_.max(datesIssue));

        return classNames({
            'rating': true,
            'issue': dateIssueMax >= date && date >= dateIssueMin,
            'issue-max': dateIssueMax === date,
            'issue-min': dateIssueMin === date,
            'closed': (dateClosed && date > dateIssueMax) || (dateOpen && date < dateOpen),
            'open': dateOpen && dateOpen === date
        });
    }

    styleForCell(bankId, date) {
        let rating = this.state.ratings[date][bankId];
        if (!rating) {
            return {};
        }

        // TODO: show range per color matrix with color=from-to
        const max = 5; // green - rgb(0, 128, 0)
        const middle = 3; // yellow - rgb(255, 255, 0)
        const min = 1; // red - rgb(255, 0, 0)
        const scale = this.state.scale;
        rating = Math.max(min, Math.min(max, rating)); // truncate
        rating = Math.floor(rating * scale) / scale; // resolution
        const red = rating <= middle ? 255 : this.scale(rating, middle, 255, max, 0);
        const green = rating >= middle ? this.scale(rating, middle, 255, max, 128) : this.scale(rating, min, 0, middle, 255);
        const blue = 0;
        return {backgroundColor: `rgb(${red}, ${green}, ${blue})`};
        // return {backgroundColor: `yellow`};
    }

    scale(key, minKey, minValue, maxKey, maxValue) {
        return Math.round(minValue + (maxValue - minValue) * (key - minKey) / (maxKey - minKey));
    }
}

export default AppRatings;
