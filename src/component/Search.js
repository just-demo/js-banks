import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';

const styles = {
    root: {
        display: 'flex',
        marginLeft: 10,
        marginTop: 5,
        width: 200,
        height: 35,
    },
    input: {
        marginLeft: 10,
        flex: 1,
    },
    iconButton: {
        padding: 5,
    }
};

function Search(props) {
    const {classes, onChange} = props;

    return (
        <Paper className={classes.root} elevation={1}>
            <InputBase className={classes.input} placeholder="Search..." onChange={event => onChange(event.target.value)}/>
            <IconButton className={classes.iconButton} aria-label="Search">
                <SearchIcon/>
            </IconButton>
        </Paper>
    );
}

export default withStyles(styles)(Search);
