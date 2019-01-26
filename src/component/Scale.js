import React, {Component} from 'react';
import _ from 'lodash';
import {withStyles} from '@material-ui/core/styles';
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

const styles = () => ({
    scaleButton: {
        margin: 5,
        width: 35,
        height: 35,
        fontSize: 20
    }
});

class Scale extends Component {
    constructor(props) {
        super(props);
        this.min = _.min(this.props.values);
        this.max = _.max(this.props.values);
        this.state = {
            value: this.props.value
        }
    }

    render() {
        const {classes} = this.props;
        return (
            <div>
                <button className={classes.scaleButton} onClick={this.handleScaleDown}>-</button>
                <FormControl variant="outlined" style={{marginTop: 5}}>
                    <Select value={this.state.value} onChange={this.handleScaleSelect}
                            MenuProps={{PaperProps: {style: {maxHeight: 300}}}}>
                        {_.range(this.min, this.max + 1).map(value => (
                            <MenuItem key={value} value={value}>{value}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <button className={classes.scaleButton} onClick={this.handleScaleUp}>+</button>
            </div>
        );
    }

    handleScaleDown = () => {
        this.setValue(_.max(this.props.values.filter(value => value < this.state.value)) || this.min);
    };

    handleScaleUp = () => {
        this.setValue(_.min(this.props.values.filter(value => value > this.state.value)) || this.max);
    };

    handleScaleSelect = event => {
        this.setValue(parseInt(event.target.value));
    };

    setValue(value) {
        this.setState({value: value});
        this.props.onChange(value);
    }
}

export default withStyles(styles)(Scale);