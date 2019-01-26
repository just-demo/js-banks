import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';

const styles = {
    root: {
        display: 'flex',
        marginLeft: 10,
        marginTop: 3,
        width: 180,
        height: 25,
    }
};

function Search(props) {
    const {classes, onChange} = props;

    return (
        <Paper className={classes.root} elevation={0}>
            <InputBase placeholder="Пошук..." onChange={event => onChange(event.target.value)}/>
        </Paper>
    );
}

export default withStyles(styles)(Search);
