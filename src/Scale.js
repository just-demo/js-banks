import React, {Component} from 'react';

class Scale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        }
    }

    render() {
        return (
            <div>
                <button onClick={() => this.handleScaleDown()}>-</button>
                <input value={this.state.value} onChange={(event) => this.handleScaleType(event)}/>x
                <button onClick={() => this.handleScaleUp()}>+</button>
                <button onClick={() => this.setValue(1)}>1x</button>
                <button onClick={() => this.setValue(2)}>2x</button>
                <button onClick={() => this.setValue(5)}>5x</button>
                <button onClick={() => this.setValue(10)}>10x</button>
                <button onClick={() => this.setValue(100)}>100x</button>
            </div>
        );
    }

    handleScaleDown() {
        this.handleScale((current, step) => current - step);
    }

    handleScaleUp() {
        this.handleScale((current, step) => current + step);
    }

    handleScaleType(event) {
        this.setValue(parseInt(event.target.value) || 0);
    }

    handleScale(strategy) {
        const current = this.props.value;
        const step = this.getStep(current);
        this.setValue(Math.round(strategy(current, step) / (step / 10)) * (step / 10));
    }

    setValue(value) {
        value = Math.max(this.props.min, Math.min(this.props.max, value));
        this.setState({value: value});
        this.props.onChange(value);
    }

    getStep(value) {
        const round = value > 100 ? Math.floor : Math.ceil;
        return Math.max(1, Math.pow(10, round(Math.log10(Math.max(1, value)))) / 10);
    }
}

export default Scale;