import lo from 'lodash';
import classNames from './style.css'

export default class DateTimeDialog extends React.Component {

    render() {

        const date = new Date(), y = date.getFullYear(), m = date.getMonth();
        const firstDay = new Date(y, m, 1);
        const lastDay = new Date(y, m + 1, 0);
        let dow = firstDay.getDay();
        const lastDayNumber = lastDay.getDate();

        let rows = [];
        let row = [];
        if(dow > 0) {
            row.push(<td key="pre" colSpan={dow}/>);
        }
        for(let d = 1; d<=lastDayNumber; ++d) {
            row.push(<td key={d}>{d}</td>)
            if(++dow === 7) {
                dow = 0;
                rows.push(row);
                row = [];
            }
        }
        if(row.length) {
            if(dow < 7) {
                row.push(<td key="post" colSpan={7-dow}/>);
            }
            rows.push(row);
        }

        return (
            <div>
                <table className={classNames.calendar}>
                    <thead>
                        <tr>
                            <th>Su</th>
                            <th>Mo</th>
                            <th>Tu</th>
                            <th>We</th>
                            <th>Th</th>
                            <th>Fr</th>
                            <th>Sa</th>
                        </tr>
                    </thead>
                </table>
                <table className={classNames.calendar}>
                    <tbody>
                        {rows.map((r,i) => <tr key={i}>{r}</tr>)}
                    </tbody>
                </table>
            </div>
        )
    }
}

