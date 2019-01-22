import React from 'react';
import './App.css';
import {HashRouter, Link, Route} from 'react-router-dom';
import PageRatings from "./component/page/PageRatings";
import PageBanks from "./component/page/PageBanks";
import PageDBF from "./component/page/PageDBF";
import PageLogs from "./component/page/PageLogs";
import Refresh from "./component/Refresh";

const App = () => (
    <HashRouter>
        <div>
            <nav className="nav">
                <Link className="nav-link" to="/">Ratings</Link>
                <Link className="nav-link" to="/banks">Banks</Link>
                <Link className="nav-link" to="/banks/dbf">DBF</Link>
                <Link className="nav-link" to="/logs">Logs</Link>
                <Refresh/>
            </nav>
            <div>
                <Route exact path="/" component={PageRatings}/>
                <Route exact path="/banks" component={PageBanks}/>
                <Route path="/banks/dbf" component={PageDBF}/>
                <Route path="/logs" component={PageLogs}/>
            </div>
        </div>
    </HashRouter>
);

export default App;
