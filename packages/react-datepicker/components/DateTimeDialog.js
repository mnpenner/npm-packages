import lo from 'lodash';
import cn from './style.less';
import moment from 'moment';
import classnames from 'classnames';

moment.locale('es');
const months = moment.monthsShort();
const monthChunks = lo.chunk(months.map((m,n) => [n,m]),4);
const weekdays = moment.weekdaysMin();

export default class DateTimeDialog extends React.Component {


    constructor(props) {
        super(props);
        const now = new Date();
        this.state = {
            yearText: now.getFullYear().toString(),
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
        }
    }

    incYear = amount => ev => {
        ev.preventDefault();
        this.setState(({year}) => {
            const newYear = year + amount;
            return {
                year: newYear,
                yearText: newYear.toString(),
            }
        });
    };

    changeYear = ev => {
        this.setState({yearText: ev.target.value});
    };

    yearBlur = ev => {
        let year = ev.target.valueAsNumber;

        if(year >= 0 && year < 100) {
            const now = new Date();
            const fullYear = now.getFullYear();
            let shortYear = fullYear % 100;
            let m1 = fullYear - shortYear;
            let m2 = m1 - 100;

            let opt1 = year + m1;
            let opt2 = year + m2;

            year = Math.abs(fullYear - opt1) < Math.abs(fullYear - opt2) ? opt1 : opt2;
        }

        this.setState({
            year: year,
            yearText: year.toString(),
        });
    };

    clickMonth = month => ev => {
        ev.preventDefault();
        this.setState({month})
    };

    clickDay = day => ev => {
        ev.preventDefault();
        this.setState({day})
    };

    render() {
        console.log(JSON.stringify(this.state,null,2));

        const firstDay = new Date(this.state.year, this.state.month, 1);
        const lastDay = new Date(this.state.year, this.state.month + 1, 0);
        let dow = firstDay.getDay();
        const lastDayNumber = lastDay.getDate();

        let rows = [];
        let row = [];
        if(dow > 0) {
            row.push(<td key="pre" colSpan={dow}/>);
        }
        for(let d = 1; d<=lastDayNumber; ++d) {
            row.push(<td key={d} className={classnames(cn.dayBtn,{[cn.daySelected]:this.state.day==d})} onClick={this.clickDay(d)}>{d}</td>);
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
            <div className={cn.root}>
                <div className={cn.dateColumn}>
                    <div className={cn.yearContainer}>
                        <a className={cn.yearBtn} onClick={this.incYear(-10)}>&laquo;</a>
                        <a className={cn.yearBtn} onClick={this.incYear(-1)}>&lt;</a>
                        <input type="number" className={cn.yearInput} onChange={this.changeYear} onBlur={this.yearBlur} value={this.state.yearText}/>
                        <a className={cn.yearBtn} onClick={this.incYear(1)}>&gt;</a>
                        <a className={cn.yearBtn} onClick={this.incYear(10)}>&raquo;</a>
                    </div>

                    <table className={cn.monthPicker}>
                        <tbody>
                        {monthChunks.map((chunk,idx) => <tr key={idx}>{chunk.map(([m,mmm]) => <td key={m} onClick={this.clickMonth(m)} className={classnames(cn.monthBtn,{[cn.monthSelected]:this.state.month==m})}>{mmm}</td>)}</tr>)}
                        </tbody>
                    </table>

                    <div className={cn.calendarContainer}>
                        <table className={cn.calendar}>
                            <thead>
                                <tr>
                                    {weekdays.map((d,i) => <th key={i}>{d}</th>)}
                                </tr>
                            </thead>
                        </table>
                        <table className={cn.calendar}>
                            <tbody>
                                {rows.map((r,i) => <tr key={i}>{r}</tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}

