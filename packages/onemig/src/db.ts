import {createPool,PoolConfig} from "mysql3";
import {OptType} from "clap";
import {userInfo} from "os";



export function createConnection(opts: PoolConfig) {
    return createPool({
        connectionLimit: 25,
        dateStrings: true,
        ...opts,
    })
}

export const dbOptionsWithoutDb = [
    {
        name: 'host',
        alias: 'h',
        description: "Connect to the MySQL server on the given host.",
        defaultValue: process.env.DB_HOST ?? 'localhost',
        valuePlaceholder: 'host_name',
    },
    {
        name: 'port',
        alias: 'P',
        description: "For TCP/IP connections, the port number to use.",
        type: OptType.INT,
        defaultValue: process.env.DB_PORT !== undefined ? Number(process.env.DB_PORT) : 3306,
    },
    {
        name: 'user',
        alias: 'u',
        description: "The user name of the MySQL account to use for connecting to the server.",
        defaultValue: () => process.env.DB_USER ?? userInfo().username,
        valuePlaceholder: 'user_name',
    },
    {
        name: 'password',
        alias: 'p',
        description: "The password of the MySQL account used for connecting to the server.",
        defaultValue: process.env.DB_PASSWORD,
        defaultValueText: process.env.DB_PASSWORD !== undefined ? '$DB_PASSWORD' : '(no pasword)',
    }
]

export const dbOptions = [
    ...dbOptionsWithoutDb,
    {
        name: 'database',
        alias: 'D',
        description: "The database to use.",
        valuePlaceholder: 'db_name',
        defaultValue: process.env.DB_NAME,
        required: true
    },
]

