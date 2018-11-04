import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import AppRatings from "./AppRatings";
import AppBankList from "./AppBankList";
import AppDBFList from "./AppDBFList";

const App = () => (
    <HashRouter>
        <div>
            <nav className="nav">
                <Link className="nav-link" to="/">Ratings</Link>
                <Link className="nav-link" to="/banks">Banks</Link>
                <Link className="nav-link" to="/banks/dbf">DBF</Link>
            </nav>
            <div>
                <Route exact path="/" component={AppRatings}/>
                <Route exact path="/banks" component={AppBankList}/>
                <Route path="/banks/dbf" component={AppDBFList}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
