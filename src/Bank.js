import React from 'react';

const Bank = (props) => {
    const bank = props.data;
    const source = {
        nbu: 'НБУ',
        api: 'НБУ API',
        pdf: 'НБУ PDF',
        dbf: 'НБУ DBF',
        // Deposit Guarantee Fund
        fund: 'ФГВФО',
        minfin: 'Міфін'
    };

    const emptyLine = <tr><td colSpan={2}>-</td></tr>;
    // TODO:
    // 1) show sites and link to problems
    // 2) show only one start date without source since the date is always the same, or show list only if there is difference
    // 3) write better CSS
    return (
        <table>
            <tbody>
                <tr>
                    <td colSpan={2}>Start dates</td>
                </tr>
                {!Object.keys(bank.dateOpen).length && emptyLine}
                {Object.keys(bank.dateOpen).map(type => (
                    <tr key={type}>
                        <td>{source[type]}</td>
                        <td>{bank.dateOpen[type] || '-'}</td>
                    </tr>
                ))}

                <tr>
                    <td colSpan={2}>Problems</td>
                </tr>
                {!Object.keys(bank.dateIssue).length && emptyLine}
                {Object.keys(bank.dateIssue).map(type => (
                    <tr key={type}>
                        <td>{source[type]}</td>
                        <td>{bank.dateIssue[type] || '-'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
};

export default Bank;