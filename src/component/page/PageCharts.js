import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import rcolor from 'rcolor';
import _ from "lodash";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

class PageCharts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            top: 3,
            lastOnly: true,
            banks: [],
            ratings: {}
        };
    }

    componentDidMount() {
        fetch('/data/banks.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));


        fetch('/data/minfin-ratings.json')
            .then(ratings => ratings.json())
            .then(ratings => this.setState({ratings: ratings}));
    }

    getMostRelevantBankName(bank) {
        // Even thought banks names were sorted in such a way that most relevant go first there are cases when non-relevant name groups go first and mess up final result
        const nameCounts = _.countBy(_.flatten([bank.names.api, bank.names.nbu, bank.names.fund].filter(_.identity)), _.identity);
        return _.maxBy(Object.keys(nameCounts), name => nameCounts[name]) || bank.name.minfin
    }

    topBy(array, number, iteratee) {
        if (!number || array.length <= number) {
            return array;
        }

        array = _.sortBy(array, iteratee).reverse();
        // Can't simply use slice because multiple equal values may fall into top and thereby exceed requested number
        const top = [];
        for (let i = 0; i < array.length && (top.length < number || iteratee(_.last(top)) <= iteratee(array[i])); i++) {
            top.push(array[i]);
        }

        return top;
    }

    render() {
        const dates = Object.keys(this.state.ratings).sort();
        const nameById = {};
        this.state.banks
            .filter(bank => bank.internal.id.minfin)
            .forEach(bank => nameById[bank.internal.id.minfin] = this.getMostRelevantBankName(bank));

        const topSearchScope = this.state.lastOnly && dates.length ? [this.state.ratings[_.last(dates)]] : Object.values(this.state.ratings);
        const top = _.uniq(_.flatten(
            topSearchScope.map(dateRatings => this.topBy(Object.keys(dateRatings), this.state.top, id => dateRatings[id]))
        ));

        const ratings = top.map(id => {
            const color = rcolor();
            return {
                label: nameById[id],
                data: dates.map(date => this.state.ratings[date][id]),
                fill: false,
                lineTension: 0.1,
                borderCapStyle: 'butt',
                borderDash: [],
                borderDashOffset: 0.0,
                borderJoinStyle: 'miter',
                pointBorderWidth: 1,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                pointRadius: 1,
                pointHitRadius: 10,
                backgroundColor: color,
                borderColor: color,
                pointBorderColor: color,
                pointBackgroundColor: color,
                pointHoverBackgroundColor: color,
                pointHoverBorderColor: color
            };
        });
        const data = {
            labels: dates,
            datasets: ratings
        };

        return (
            <div>
                <div>
                    <FormControl variant="outlined" style={{margin: 5}}>
                        <Select value={this.state.top} onChange={event => this.setState({top: event.target.value})}>
                            {_.range(0, 11).map(value => (
                                <MenuItem key={value} value={value}>{value ? 'Топ-' + value : 'Всі'}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl variant="outlined" style={{margin: 5}}>
                        <Select value={this.state.lastOnly}
                                onChange={event => this.setState({lastOnly: event.target.value})}>
                            {[true, false].map(value => (
                                <MenuItem key={value} value={value}>{value ? 'за останніми показниками' : 'за весь період'}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </div>
                <Line height={100} data={data}/>
            </div>
        );
    }
}

export default PageCharts;
