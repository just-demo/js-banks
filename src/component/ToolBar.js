import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {Link, Route, withRouter} from 'react-router-dom';
import PageRatings from "./page/PageRatings";
import PageBanks from "./page/PageBanks";
import PageDBF from "./page/PageDBF";
import PageLogs from "./page/PageLogs";
import UserMenu from "./UserMenu";
import PageRefresh from "./page/PageRefresh";
import classNames from 'classnames';
import _ from 'lodash';
import Disclaimer from "./Disclaimer";
import PageCharts from "./page/PageCharts";

const styles = () => ({
    activeLink: {
        textDecoration: 'underline'
    }
});

class ToolBar extends Component {
    constructor(props) {
        super(props);
        this.state = {access: 0};
        this.links = [{
            path: '/',
            title: 'Графік',
            access: 0
        }, {
            path: '/ratings',
            title: 'Таблиця',
            access: 0
        }, {
            path: '/banks',
            title: 'Банки',
            access: 1
        }, {
            path: '/dbf',
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
    }

    handleAccessChange = access => {
        this.setState({access: access});
    };

    getPageAccess(path) {
        const link = _.find(this.links, link => link.path === path);
        return link ? link.access : 0;
    }

    render() {
        const {classes} = this.props;
        const selectedPath = this.props.location.pathname;
        if (this.getPageAccess(selectedPath) > this.state.access) {
            this.props.history.push('/');
        }

        return (
            <div style={{flexGrow: 1}}>
                <AppBar position="static">
                    <Toolbar>
                        {this.links.filter(link => link.access <= this.state.access).map(link => (
                            <Link key={link.path} to={link.path} style={{color: 'white'}} className={classNames({
                                [classes.activeLink]: link.path === selectedPath
                            })}><Button color="inherit">{link.title}</Button></Link>
                        ))}
                        <Typography color="inherit" style={{flexGrow: 1}}/>
                        <UserMenu selected={this.state.access} onSelect={this.handleAccessChange}/>
                    </Toolbar>
                </AppBar>
                <Disclaimer/>
                <Route exact path="/" component={PageCharts}/>
                <Route path="/ratings" component={PageRatings}/>
                <Route path="/banks" component={PageBanks}/>
                <Route path="/dbf" component={PageDBF}/>
                <Route path="/refresh" component={PageRefresh}/>
                <Route path="/logs" component={PageLogs}/>
            </div>
        );
    }
}

export default withRouter(withStyles(styles)(ToolBar));
