import React, {Component} from 'react';

import {HashRouter} from 'react-router-dom';
import ToolBar from "./component/ToolBar";

class App extends Component {
    render() {
        return (
            <HashRouter>
                <ToolBar/>
            </HashRouter>
        );
    }
}

export default App;
