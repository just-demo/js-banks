import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import AppBanks from "./AppBanks";
import AppBankGovList from "./AppBankGovList";
import AppBankList from "./AppBankList";
import AppDBFList from "./AppDBFList";

const App = () => (
    <HashRouter>
        <div>
            <nav className="nav">
                <Link className="nav-link" to="/">Ratings</Link>
                <Link className="nav-link" to="/banks">Banks</Link>
                <Link className="nav-link" to="/banks/gov">Gov Banks</Link>
                <Link className="nav-link" to="/banks/abf">ABF</Link>
            </nav>
            <div>
                <Route exact path="/" component={AppBanks}/>
                <Route exact path="/banks" component={AppBankList}/>
                <Route path="/banks/gov" component={AppBankGovList}/>
                <Route path="/banks/abf" component={AppDBFList}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
