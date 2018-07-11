import Napi from '@nucleuslabs/napi-js';
const napi = new Napi;
export default napi;


export const dbNameMap = new Map;
// export const pcsDbNameMap = new Map;
for(const [gsid,agency] of Object.entries(napi.data.database.agency)) {
    for(const [appId,dbName] of Object.entries(agency.db_names)) {
        dbNameMap.set(dbName,[gsid,appId]);
        // pcsDbNameMap.set(dbName,agency.db_names.pcs);
    }
}
export const dbNames = Array.from(dbNameMap.keys()).sort();