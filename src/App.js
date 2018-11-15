import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import AppRatings from "./AppRatings";
import AppBanks from "./AppBanks";
import AppDBF from "./AppDBF";

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
                <Route exact path="/banks" component={AppBanks}/>
                <Route path="/banks/dbf" component={AppDBF}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
