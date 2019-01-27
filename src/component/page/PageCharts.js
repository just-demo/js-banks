import React, {Component} from 'react';
import {Line} from 'react-chartjs-2';
import rcolor from 'rcolor';

class PageCharts extends Component {
    constructor(props) {
        super(props);
        this.state = {ratings: this.sampleRatings()}
    }

    sampleRatings() {
        const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];
        const datasets = Array.from(Array(10).keys()).map(number => ({
            label: 'DS ' + number,
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
            backgroundColor: rcolor(),
            borderColor: rcolor(),
            pointBorderColor: rcolor(),
            pointBackgroundColor: rcolor(),
            pointHoverBackgroundColor: rcolor(),
            pointHoverBorderColor: rcolor(),
            data: labels.map(() => number + Math.round(Math.random() * 5))
        }));

        return {
            labels: labels,
            datasets: datasets
        };
    }

    render() {
        return (
            <Line data={this.state.ratings} />
        );
    }
}

export default PageCharts;
