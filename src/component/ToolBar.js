import React, {Component} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {Link, Redirect, Route} from 'react-router-dom';
import PageRatings from "./page/PageRatings";
import PageBanks from "./page/PageBanks";
import PageDBF from "./page/PageDBF";
import PageLogs from "./page/PageLogs";
import UserMenu from "./UserMenu";
import PageRefresh from "./page/PageRefresh";
import classNames from 'classnames';

class ToolBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            access: 0,
            selectedLink: 0
        };
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

        console.log(this.props.history);
        console.log(this.props.router);
    }

    handleAccessChange = access => {
        this.setState({access: access});
    };

    render() {
        if (this.links[this.state.selectedLink].access > this.state.access) {
            // return <Redirect to="/" push={true}/>
        }

        return (
            <div style={{flexGrow: 1}}>
                <AppBar position="static">
                    <Toolbar>
                        {this.links.filter(link => link.access <= this.state.access).map((link, linkIndex) => (
                            <Link onClick={() => this.setState({selectedLink: linkIndex})} key={link.path}
                                  style={{color: 'white'}} className={classNames({
                                // TODO: track selected link based on current url instead of index, e.g. if user navigates to a page by typing link directly
                                selectedLink: this.state.selectedLink === linkIndex
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

export default ToolBar;
