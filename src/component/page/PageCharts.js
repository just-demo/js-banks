import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import rcolor from 'rcolor';
import _ from "lodash";

class PageCharts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            top: 3,
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

    render() {
        const dates = Object.keys(this.state.ratings).sort();
        const nameById = {};
        this.state.banks
            .filter(bank => bank.internal.id.minfin)
            .forEach(bank => nameById[bank.internal.id.minfin] = this.getMostRelevantBankName(bank));


        const top = _.uniq(_.flatten(
            Object.values(this.state.ratings)
                .map(dateRatings => _.sortBy(Object.keys(dateRatings), id => dateRatings[id]).reverse().slice(0, this.state.top))
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
            <Line height={100} data={data}/>
        );
    }
}

export default PageCharts;
