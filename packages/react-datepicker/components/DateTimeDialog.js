import {PropTypes} from 'react';
import lo from 'lodash';
import cn from './style.less';
import moment from 'moment';
import classnames from 'classnames';
import SunCalc from 'suncalc';

moment.locale('en');
const localeData = moment.localeData();
const months = localeData.monthsShort();
const monthChunks = lo.chunk(months.map((m,n) => [n,m]),4);
const weekdays = localeData.weekdaysMin();
const firstDayOfWeek = localeData.firstDayOfWeek(); // TODO: factor this in
console.log('firstDayOfWeek',firstDayOfWeek);
// console.log(SunCalc.times);

function round(n, p) {
    return Math.round(n/p)*p;
}

SunCalc.addTime(-3, 'am0', 'pm4');
SunCalc.addTime(3, 'am1', 'pm3');
SunCalc.addTime(9, 'am2', 'pm2');
SunCalc.addTime(15, 'am3', 'pm1');
SunCalc.addTime(21, 'am4', 'pm0');

const skyColors = [
    '#07242C',
    '#143E4C',
    '#2D6577',
    '#65B5D0',
    '#ECF4F8',
];

export default class DateTimeDialog extends React.Component {

    static propTypes = {
        locale: PropTypes.string,
        militaryTime: PropTypes.bool, // aka 24-hour clock
        minuteInterval: PropTypes.number,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
    };

    static defaultProps = {
        locale: 'en',
        militaryTime: false,
        minuteInterval: 5,
        latitude: 49.1805940,
        longitude: -122.8456780,
    };

    constructor(props) {
        super(props);
        const now = new Date();
        this.state = {
            yearText: now.getFullYear().toString(),
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
            hour: now.getHours(),
            minute: round(now.getMinutes(),props.minuteInterval),
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
        // console.log(JSON.stringify(this.state,null,2));

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
            row.push(<td key={d} className={classnames(cn.dayBtn,{[cn.daySelected]:this.state.day===d})} onClick={this.clickDay(d)}>{d}</td>);
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

        let startOfDay = new Date(this.state.year, this.state.month, this.state.day, 0, 0, 0);
        let noon = new Date(this.state.year, this.state.month, this.state.day, 12, 0, 0);
        let endOfDay = new Date(this.state.year, this.state.month, this.state.day, 23, 59, 59, 999);
        let sunTimes = SunCalc.getTimes(noon, this.props.latitude, this.props.longitude);
        // let startPos = SunCalc.getPosition(startOfDay, this.props.latitude, this.props.longitude);
        // let endPos = SunCalc.getPosition(startOfDay, this.props.latitude, this.props.longitude);

        let amRange = noon.getTime() - startOfDay.getTime();
        let pmRange = endOfDay.getTime() - noon.getTime();
        // console.log('pmRange',pmRange);
        // let nadirPercent = (sunTimes.nadir.getTime() - startOfDay.getTime())/amRange*100;
        // let noonPercent = (sunTimes.solarNoon.getTime() - startOfDay.getTime())/amRange*100;
        // let nightEndPercent = (sunTimes.nightEnd.getTime() - startOfDay.getTime())/amRange*100;
        // let nauticalDawnPercent = (sunTimes.nauticalDawn.getTime() - startOfDay.getTime())/amRange*100;
        // let dawnPercent = (sunTimes.dawn.getTime() - startOfDay.getTime())/amRange*100;
        // console.log('sunTimes',sunTimes);
        // console.log(nadirPercent, nightEndPercent, nauticalDawnPercent, dawnPercent, noonPercent);
        // console.log('xxx',SunCalc.getTimes(new Date(2017,5,21,12,0,0),49.1,-122.8));

        let amGradient = [];
        let pmGradient = [];
        // console.log('noon',noon);
        for(let i=0; i<5; ++i) {
            let at = sunTimes[`am${i}`].getTime();
            if(!isNaN(at)) {
                let pc = (at - startOfDay.getTime()) / amRange;
                amGradient.push(`${skyColors[i]} ${pc * 100}%`);
            }

            let pt = sunTimes[`pm${i}`].getTime();
            if(!isNaN(pt)) {
                let pc = (pt - noon.getTime())/pmRange;
                pmGradient.push(`${skyColors[4-i]} ${pc*100}%`);
            }
        }
        // console.log('endOfDay',endOfDay);
        // console.log(pmGradient);


        // console.log(SunCalc.getPosition(startOfDay, this.props.latitude, this.props.longitude));

        // let sunTimes = SunCalc.getTimes(new Date(), this.props.latitude, this.props.longitude);
        // console.log(sunTimes);
        // console.log(SunCalc.getPosition(sunTimes.nadir, this.props.latitude, this.props.longitude));
        // console.log(SunCalc.getPosition(sunTimes.solarNoon, this.props.latitude, this.props.longitude));
        // let darkest = -0.687470273549926
        // let lightest = 0.740826542700143


        return (
            <div className={cn.root}>
                <div className={cn.column}>
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
                <div className={cn.column}>
                    <div className={cn.pmCol} style={{background:`linear-gradient(to bottom,${pmGradient.join(',')})`}}>
                    <div className={cn.amCol} style={{background:`linear-gradient(to bottom,${amGradient.join(',')})`}}>
                        <table className={cn.hourTable}>
                            <tbody>
                                {lo.times(12, i => {
                                    let disp = i === 0 ? '12' : String(i);
                                    return (
                                        <tr key={i}>
                                            <td className={classnames(cn.hourCell, cn.hourBtn,{[cn.hourSelected]:this.state.hour===i})}>{disp}<sup>am</sup></td>
                                            <td className={classnames(cn.hourCell, cn.hourBtn,{[cn.hourSelected]:this.state.hour===i+12})}>{disp}<sup>pm</sup></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    </div>
                </div>
                <div className={cn.column}>
                    <table>
                        <tbody>
                            {lo.range(0, 60, 5).map(i => {
                                let disp = i < 10 ? `0${i}` : String(i);
                                return (
                                    <tr key={i}>
                                        <td className={classnames(cn.minCell, cn.minBtn,{[cn.minSelected]:this.state.minute===i})}>{disp}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
                <pre>
                    {JSON.stringify(this.state,null,2)}
                </pre>
            </div>
        )
    }
}
