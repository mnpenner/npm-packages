import {PropTypes} from 'react';
import lo from 'lodash';
import cn from './style.less';
import moment from 'moment-timezone/moment-timezone';
import classnames from 'classnames';
import SunCalc from 'suncalc';

moment.locale('en-ca');
const localeData = moment.localeData();
const months = localeData.monthsShort();
const monthChunks = lo.chunk(months.map((m,n) => [n,m]),3);
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
    '#1F252D',
    '#263E66',
    '#4773BB',
    '#87A4D3',
    '#DBE9FF',
];

export default class DateTimeDialog extends React.Component {

    static propTypes = {
        locale: PropTypes.string,
        militaryTime: PropTypes.bool, // aka 24-hour clock
        minuteInterval: PropTypes.number,
        latitude: PropTypes.number,
        longitude: PropTypes.number,
        lastMinute: PropTypes.bool,
        timezone: PropTypes.string,
    };

    static defaultProps = {
        locale: 'en',
        militaryTime: false,
        minuteInterval: 5,
        latitude: 49.700000,
        longitude: -96.809722,
        lastMinute: true,
        timezone: 'UTC',
    };

    constructor(props) {
        super(props);
        const now = new Date();
        const c = this;

        now.setMinutes(round(now.getMinutes()+now.getSeconds()/60,props.minuteInterval));
        this.state = {
            yearText: now.getFullYear().toString(),
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
            hour: now.getHours(),
            minute: now.getMinutes(),
            loading: !moment.tz.zone(props.timezone),
        };


        if(this.state.loading) {
            require([`bundle-loader!../data/${props.timezone}.txt`], function(bundle) {
                bundle(tzData => {
                    console.log('loaded',props.timezone);
                    moment.tz.add(tzData);
                    c.setState({loading: false});
                });
            });
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

    clickHour = hour => ev => {
        ev.preventDefault();
        this.setState({hour})
    };

    clickMinute = minute => ev => {
        ev.preventDefault();
        this.setState({minute})
    };

    wheelMinute = ev => {
        ev.preventDefault();
        let minute = this.state.minute + this.props.minuteInterval * Math.sign(ev.deltaY);
        while(minute < 0) {
            minute += 60;
        }
        while(minute >= 60) {
            minute -= 60;
        }
        this.setState({minute})
    };

    wheelHour = ev => {
        ev.preventDefault();
        let hour = this.state.hour + Math.sign(ev.deltaY);
        while(hour < 0) {
            hour += 24;
        }
        while(hour >= 24) {
            hour -= 24;
        }
        this.setState({hour})
    };

    render() {

        // console.log(JSON.stringify(this.state,null,2));
        if(this.state.loading) {
            return <p>Loading...</p>;
        }

        const selectedDate = new Date(this.state.year, this.state.month, this.state.day, this.state.hour, this.state.minute, 0);

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

        let startOfHour = new Date(this.state.year, this.state.month, this.state.day, this.state.hour, 0, 0);
        let endOfHour = new Date(this.state.year, this.state.month, this.state.day, this.state.hour, 59, 59, 999);
        let hourRange = endOfHour.getTime() - startOfHour.getTime();

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
        let minGradient = [];
        // console.log('noon',noon);
        for(let i=0; i<5; ++i) {
            let at = sunTimes[`am${i}`].getTime();
            if(!isNaN(at)) {
                let pc = (at - startOfDay.getTime()) / amRange;
                amGradient.push(`${skyColors[i]} ${pc * 100}%`);
                if(this.state.hour < 12) {
                    let pc = (at - startOfHour.getTime()) / hourRange;
                    minGradient.push(`${skyColors[i]} ${pc * 100}%`);
                }
            }

            let pt = sunTimes[`pm${i}`].getTime();
            if(!isNaN(pt)) {
                let pc = (pt - noon.getTime())/pmRange;
                pmGradient.push(`${skyColors[4-i]} ${pc*100}%`);
                if(this.state.hour >= 12) {
                    let pc = (pt - startOfHour.getTime()) / hourRange;
                    minGradient.push(`${skyColors[4-i]} ${pc*100}%`);
                }
            }
        }

        // console.log(minGradient);
        // console.log('endOfDay',endOfDay);
        // console.log(pmGradient);


        // console.log(SunCalc.getPosition(startOfDay, this.props.latitude, this.props.longitude));

        // let sunTimes = SunCalc.getTimes(new Date(), this.props.latitude, this.props.longitude);
        // console.log(sunTimes);
        // console.log(SunCalc.getPosition(sunTimes.nadir, this.props.latitude, this.props.longitude));
        // console.log(SunCalc.getPosition(sunTimes.solarNoon, this.props.latitude, this.props.longitude));
        // let darkest = -0.687470273549926
        // let lightest = 0.740826542700143

        let minuteValues = lo.range(0, 60, this.props.minuteInterval);
        if(this.props.lastMinute && lo.tail(minuteValues) !== 59) {
            minuteValues.push(59);
        }


        return (
            <div>
            <div className={cn.root}>
                <div className={cn.header}>
                    <div>
                        {moment.tz(selectedDate, this.props.timezone).format('LLLL (z)')}
                    </div>
                </div>
                <div className={cn.body}>
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
                            <table onWheel={this.wheelHour} className={cn.hourTable}>
                                <tbody>
                                    {lo.times(12, i => {
                                        // TODO: DST switches (23 or 25-hour days) e.g. 2017-03-12T03:00:00-07:00
                                        let disp = i === 0 ? '12' : String(i);
                                        return (
                                            <tr key={i}>
                                                <td className={classnames(cn.hourCell,{[cn.timeSelected]:this.state.hour===i})}>
                                                    <a onClick={this.clickHour(i)} className={cn.timeBtn} href="">{disp}<sup>am</sup></a>
                                                </td>
                                                <td className={classnames(cn.hourCell,{[cn.timeSelected]:this.state.hour===i+12})}>
                                                    <a onClick={this.clickHour(i+12)} className={cn.timeBtn} href="">{disp}<sup>pm</sup></a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    </div>
                    <div className={cn.column}>
                        <div className={cn.minGradient} style={{background:`linear-gradient(to bottom,${minGradient.join(',')})`}}>
                        <table className={cn.minTable} onWheel={this.wheelMinute}>
                            <tbody>
                                {minuteValues.map(i => {
                                    let disp = i < 10 ? `0${i}` : String(i);
                                    return (
                                        <tr key={i}>
                                            <td className={classnames(cn.minCell,{[cn.timeSelected]:this.state.minute===i,[cn.halfHour]: i % 30 === 0 || i === 59, [cn.quarterHour]: i % 15 === 0 || i === 59})}>
                                                <a onClick={this.clickMinute(i)} className={classnames(cn.timeBtn, cn.hourBtn)} href="">{disp}</a>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            </div>
                <pre>{JSON.stringify(this.state,null,2)}</pre>
                <pre>{JSON.stringify(this.props,null,2)}</pre>
            </div>
        )
    }
}
