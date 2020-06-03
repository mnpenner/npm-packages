import {ConnectionPool} from "mysql3";


export default function createConnection() {
    return new ConnectionPool({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
    })
}
