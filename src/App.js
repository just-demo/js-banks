import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import AppBanks from "./AppBanks";
import AppBankGovList from "./AppBankGovList";
import AppBankList from "./AppBankList";

const App = () => (
    <HashRouter>
        <div>
            <nav className="nav">
                <Link className="nav-link" to="/">Ratings</Link>
                <Link className="nav-link" to="/banks">Banks</Link>
                <Link className="nav-link" to="/banks/gov">Gov Banks</Link>
            </nav>
            <div>
                <Route exact path="/" component={AppBanks}/>
                <Route exact path="/banks" component={AppBankList}/>
                <Route path="/banks/gov" component={AppBankGovList}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
