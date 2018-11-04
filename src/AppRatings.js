import React, {Component} from 'react';
import './App.css';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css'
import Scale from './Scale';

class AppRatings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scale: 1,
            banks: {},
            ratings: {}
        };

        fetch('/bank-details.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));


        fetch('/bank-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));
    }

    render() {
        // http://www.fg.gov.ua/uchasnyky-fondu
        const dates = Object.keys(this.state.ratings).sort().reverse();
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
                            <th className="vertical-bottom-to-top">{date}</th>
                        ))}
                    </tr>
                    {bankIds.map(bankId => (
                        <tr key={bankId}>
                            <td><a href={`https://minfin.com.ua/ua/company/${this.state.banks[bankId].alias}`}>{this.state.banks[bankId].name}</a></td>
                            <td><a href={this.state.banks[bankId].site}>{((this.state.banks[bankId].site || '').match(/\/\/([^/]+)/) || [])[1]}</a></td>
                            {dates.map(date => (
                                <td style={this.styleForRating(this.state.ratings[date][bankId])}>{this.state.ratings[date][bankId] || '-'}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    styleForRating(rating) {
        if (!rating) {
            return {};
        }

        // TODO: make it configurable in UI!
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
