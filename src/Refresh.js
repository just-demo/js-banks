import React, {Component} from 'react';
import Source from './node/data-source/source';
import isNode from 'detect-node';

class Refresh extends Component {
    render() {
        return (
            <div style={{margin: 5, marginLeft: 20}}>
                <button onClick={() => this.handleRefresh()}>Refresh</button>
            </div>
        );
    }

    handleRefresh() {
        console.log('Refreshing...', isNode);
        const startTime = new Date();
        const source = new Source();
        Promise.all([
            source.getBanks().then(banks => console.log(banks)),
            source.getRatings().then(ratings => console.log(ratings))
        ]).then(() => console.log('Total time:', new Date() - startTime));
    }
}

export default Refresh;