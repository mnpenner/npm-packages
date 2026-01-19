
// https://t-code.pl/blog/2016/11/Towards-server-side-routing-with-URI-Templates/
// https://www.npmjs.com/package/urijs
// https://tools.ietf.org/html/rfc6570
// import {URI} from 'uri-template-lite';
// import UriTemplate from 'uri-templates';
//
// const routes = {
//     foo: '/xschedule/{year:4}-{month:2}-{day:2}',
//     scheduleYearMonthDay: '/schedule/{year:4}-{month:2}-{day:2}',
//     scheduleYearMonth: '/schedule/{year:4}-{month:2}',
//     scheduleYear: '/schedule/{year:4}',
//     scheduleOptDate: '/schedule{/date?}',
//     schedule: '/schedule',
//     dashboard: '/',
// }
//
// function findMatch(url: string) {
//     for(const [k,v] of Object.entries(routes)) {
//         if(v.match(url) !== false) return k;
//     }
//     return null;
// }
//
//
// // const url = '/schedule/2019-12';
// const url = '/schedule';
//
// for(const [k,v] of Object.entries(routes)) {
//     const templ = new URI.Template(v);
//     const match = templ.match(url);
//     console.log('uri-template-lite',k,match);
//
//     // const templ2 = new UriTemplate(v);
//     // const match2 = templ2.fromUri(v);
//     // console.log('uri-templates',k,match2);
// }


import {UriTemplate} from "./uri-template"

// const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}{?foo,q*}');
// log(templ);
// const match = templ.match('/schedule/2019-12-31?foo=bar&baz=bux'); // url+pathname + url.search + url.hash
// log(match);
//
//
// const templ2 = new UriTemplate('/books{;author}/gallery');
// log(templ2);
// const match2 = templ2.match('/books;author=John Grisham/gallery'); // url+pathname + url.search + url.hash
// log(match2);

{
    const templ = new UriTemplate('{+path}/here')
    // console.log(templ);
    console.log(templ.match('/foo/bar/here'))
}
{
    const templ = new UriTemplate<{firstName:string,lastName:string}>('/people/{firstName}-{lastName}/SSN')
    // console.log(templ);
    console.log(templ.match('/people/Björk-Guðmundsdóttir/SSN'))
    console.log(templ.expand({firstName: 'Mark', lastName: "Penner"}))
}
{
    const templ = new UriTemplate('/query{?firstName,lastName}')
    // console.log(templ);
    console.log(templ.match('/query?firstName=Bj%c3%b6rk&lastName=Gu%c3%b0mundsd%c3%b3ttir'))
    console.log(templ.expand({firstName: 'Mark', lastName: 'Penner'}))
}
{
    const templ = new UriTemplate('weather/{state}/{city}?forecast={day}')
    // console.log(templ);
    console.log(templ.match('weather/Washington/Redmond?forecast=today'))
}
