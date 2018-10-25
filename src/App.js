import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css'
import AppBanks from "./AppBanks";
import AppBankGovList from "./AppBankGovList";
import AppBankList from "./AppBankList";

const App = () => (
    <HashRouter>
        <div>
            <div>
                <Link to="/">Ratings</Link>
                <Link to="/banks">Banks</Link>
                <Link to="/banks/gov">Gov Banks</Link>
            </div>
            <div>
                <Route exact path="/" component={AppBanks}/>
                <Route exact path="/banks" component={AppBankList}/>
                <Route path="/banks/gov" component={AppBankGovList}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
