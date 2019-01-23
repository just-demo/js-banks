import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import {useState} from 'react';

import {HashRouter, Link, Route} from 'react-router-dom';
import PageRatings from "./component/page/PageRatings";
import PageBanks from "./component/page/PageBanks";
import PageDBF from "./component/page/PageDBF";
import PageLogs from "./component/page/PageLogs";
import UserMenu from "./component/UserMenu";
import PageRefresh from "./component/page/PageRefresh";


const styles = {
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
    },
    menuLink: {
        color: 'white',
    },
};

function App(props) {
    const {classes} = props;
    const [access, setAccess] = useState(0);

    const links = [{
        path: '/',
        title: 'Рейтинги',
        access: 0
    }, {
        path: '/banks',
        title: 'Банки',
        access: 1
    }, {
        path: '/banks/dbf',
        title: 'База НБУ',
        access: 1
    }, {
        path: '/refresh',
        title: 'Оновлення',
        access: 1
    }, {
        path: '/logs',
        title: 'Логи',
        access: 1
    }];

    return (
        <HashRouter>
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        {/*<IconButton className={classes.menuButton} color="inherit" aria-label="Menu">*/}
                        {/*<MenuIcon/>*/}
                        {/*</IconButton>*/}
                        {links.filter(link => link.access <= access).map(link => (
                            <Link key={link.path} className={classes.menuLink} to={link.path}><Button color="inherit">{link.title}</Button></Link>
                        ))}
                        <Typography color="inherit" className={classes.grow}/>
                        <UserMenu selected={access} onSelect={access => setAccess(access)}/>
                    </Toolbar>
                </AppBar>
                <Route exact path="/" component={PageRatings}/>
                <Route exact path="/banks" component={PageBanks}/>
                <Route path="/banks/dbf" component={PageDBF}/>
                <Route path="/refresh" component={PageRefresh}/>
                <Route path="/logs" component={PageLogs}/>
            </div>
        </HashRouter>
    );
}

App.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(App);
