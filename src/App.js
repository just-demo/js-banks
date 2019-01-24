import React, {Component} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import {HashRouter, Link, Route} from 'react-router-dom';
import PageRatings from "./component/page/PageRatings";
import PageBanks from "./component/page/PageBanks";
import PageDBF from "./component/page/PageDBF";
import PageLogs from "./component/page/PageLogs";
import UserMenu from "./component/UserMenu";
import PageRefresh from "./component/page/PageRefresh";
import classNames from 'classnames';

class App extends Component {
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
            // TODO: how to redirect to home page programmatically?
        }

        return (
            <HashRouter>
                <div style={{flexGrow: 1}}>
                    <AppBar position="static">
                        <Toolbar>
                            {this.links.filter(link => link.access <= this.state.access).map((link, linkIndex) => (
                                <Link onClick={() => this.setState({selectedLink: linkIndex})} key={link.path} style={{color: 'white'}} className={classNames({
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
            </HashRouter>
        );
    }
}

export default App;
