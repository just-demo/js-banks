import React, {Component} from 'react';
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

class ToolBar extends Component {
    constructor(props) {
        super(props);
        this.state = {access: 0};
        this.links = [{
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
    }

    handleAccessChange = access => {
        this.setState({access: access});
    };

    getPageAccess(path) {
        const link = _.find(this.links, link => link.path === path);
        return link ? link.access : 0;
    }

    render() {
        const selectedPath = this.props.location.pathname;
        if (this.getPageAccess(selectedPath) > this.state.access) {
            this.props.history.push('/');
        }

        return (
            <div style={{flexGrow: 1}}>
                <AppBar position="static">
                    <Toolbar>
                        {this.links.filter(link => link.access <= this.state.access).map(link => (
                            <Link key={link.path} style={{color: 'white'}} className={classNames({
                                selectedLink: link.path === selectedPath
                            })} to={link.path}><Button color="inherit">{link.title}</Button></Link>
                        ))}
                        <Typography color="inherit" style={{flexGrow: 1}}/>
                        <UserMenu selected={this.state.access} onSelect={this.handleAccessChange}/>
                    </Toolbar>
                </AppBar>
                <Route exact path="/" component={PageRatings}/>
                <Route exact path="/banks" component={PageBanks}/>
                <Route path="/banks/dbf" component={PageDBF}/>
                <Route path="/refresh" component={PageRefresh}/>
                <Route path="/logs" component={PageLogs}/>
            </div>
        );
    }
}

export default withRouter(ToolBar);
