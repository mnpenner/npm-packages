import Napi from '@nucleuslabs/napi-js';
const napi = new Napi;
export default napi;


export const dbNameMap = new Map;
for(const [gsid,agency] of Object.entries(napi.data.database.agency)) {
    for(const [appId,dbName] of Object.entries(agency.db_names)) {
        dbNameMap.set(dbName,[gsid,appId]);
    }
}
export const dbNames = Array.from(dbNameMap.keys()).sort();