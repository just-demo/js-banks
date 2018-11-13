import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Scale from './Scale';
import t from './test';

class AppRatings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scale: 1,
            banks: {},
            ratings: {}
        };

        fetch('/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: this.convertBanks(banks)}));


        fetch('/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));

        console.log(t.hello());
    }

    convertBanks(banks) {
        return _.keyBy(banks.map(bank => {
            return {
                id: bank.internal.id.minfin,
                name: bank.name.minfin,
                site: (bank.site.minfin || [])[0],
                link: bank.internal.link.minfin,
                dateOpen: bank.dateOpen.dbf,
                dateIssue: bank.dateIssue.api,
                dateIssueFund: bank.dateIssue.fund
            };
        }).filter(bank => bank.name), 'id');
    }

    render() {
        const dates = Object.keys(this.state.ratings).sort().reverse();
        const openDates = {};
        const issueDates = {};
        const fundIssueDates = {};
        _.forOwn(this.state.banks, (bank, bankId) => dates.forEach(date => {
            if (bank.dateOpen && bank.dateOpen < date) {
                openDates[bankId] = date;
            }
            if (bank.dateIssue && bank.dateIssue < date) {
                issueDates[bankId] = date;
            }
            if (bank.dateIssueFund && bank.dateIssueFund < date) {
                fundIssueDates[bankId] = date;
            }
        }));

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
        const bankIds = Object.keys(this.state.banks).sort((a, b) => {
            const aRating = latestRating[a];
            const bRating = latestRating[b];

            if (aRating && bRating) {
                if (aRating.date !== bRating.date) {
                    return aRating.date > bRating.date ? 1 : -1;
                }
                if (aRating.rating !== bRating.rating) {
                    return aRating.rating > bRating.rating ? 1 : -1;
                }
                return 0;
            }
            return aRating ? 1 : (bRating ? -1 : 0);
        }).reverse();

        return (
            <div>
                <Scale value={this.state.scale} min={1} max={100} onChange={(scale) => this.setState({scale: scale})}/>
                <table className="banks">
                    <tbody>
                    <tr>
                        <th>&nbsp;</th>
                        <th>&nbsp;</th>
                        {dates.map(date => (
                            <th key={date} className="vertical-bottom-to-top">{date}</th>
                        ))}
                    </tr>
                    {bankIds.map(bankId => (
                        <tr key={bankId}>
                            <td><a href={this.state.banks[bankId].link}>{this.state.banks[bankId].name}</a></td>
                            <td><a href={this.state.banks[bankId].site}>{((this.state.banks[bankId].site || '').match(/\/\/([^/]+)/) || [])[1]}</a></td>
                            {dates.map(date => (
                                <td key={date} style={this.styleForCell(bankId, date, openDates, issueDates, fundIssueDates)}>{this.state.ratings[date][bankId] || '-'}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    styleForCell(bankId, date, openDates, issueDates, fundIssueDates) {
        return {
            ...this.styleForRating(this.state.ratings[date][bankId]),
            ...this.styleForOpenDate(openDates[bankId] === date),
            ...this.styleForIssueDate(issueDates[bankId] === date),
            ...this.styleForFundIssueDate(fundIssueDates[bankId] === date)
        };
    }

    styleForOpenDate(isOpenDate) {
        return isOpenDate ? {
            borderColor: 'green',
            borderWidth: 3
        } : {};
    }

    styleForIssueDate(isIssueDate) {
        return isIssueDate ? {
            borderColor: 'red',
            borderWidth: 3
        } : {};
    }

    styleForFundIssueDate(isIssueDate) {
        return isIssueDate ? {
            // https://css-tricks.com/stripes-css/
            background: 'repeating-linear-gradient(45deg, pink, pink 5px, deeppink 5px, deeppink 10px)'
        } : {};
    }

    styleForRating(rating) {
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
