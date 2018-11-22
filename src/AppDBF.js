import React, {Component} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css'
import ReactTable from 'react-table';
import 'react-table/react-table.css'

class AppDBF extends Component {
    constructor(props) {
        super(props);
        this.state = {banks: []};
    }

    componentDidMount() {
        fetch('/dbf.json')
            .then(banks => banks.json())
            .then(banks => this.setState({banks: banks}));
    }

    render() {
        // const columns = (this.state.banks[0] || []).map((value, index) => {
        //     return {
        //         id: value,
        //         Header: value,
        //         accessor: values => values[index]
        //     };
        // });
        // const data = this.state.banks.slice(1);
        // console.log(data.length);
        //
        // return (
        //     <ReactTable
        //         data={data}
        //         columns={columns}
        //         pageSizeOptions={[10, 100]}
        //         defaultPageSize={100}
        //     />
        // );
        return (
            <div>
                <table className="banks">
                    <tbody>
                    {this.filter(this.state.banks).map((bank, index) => (
                        <tr>
                            <td>{index}</td>
                            {bank.map(field => (
                                <td style={{whiteSpace: 'nowrap'}}>{field}</td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    }

    filter(data) {
        // const term = 'Укрексўмбанк'.toLowerCase();
        // return data.filter((row, index) => !index || row.some(cell => ('' + cell).toLowerCase().includes(term)));
        return data;
    }
}

export default AppDBF;
