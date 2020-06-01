import {run} from "./cli";
import * as pkg from '../package.json'
import {userInfo} from 'os';
import {OptType} from "./cli/interfaces";

run({
    name: "OneMig",
    version: pkg.version,
    argv0: pkg.name,
    commands: [
        {
            name: "export",
            description: "Export definitions from existing database",
            async execute(opts: Record<string, string>) {
                console.log(opts)
            },
            options: [
                {
                    name: 'host',
                    alias: 'h',
                    description: "Connect to the MySQL server on the given host.",
                    defaultValueText: 'localhost',
                    valuePlaceholder: 'host_name',
                },
                {
                    name: 'port',
                    alias: 'P',
                    description: "For TCP/IP connections, the port number to use.",
                    type: OptType.INT,
                    defaultValueText: '3306',
                },
                {
                    name: 'database',
                    alias: 'D',
                    description: "The database to use.",
                    valuePlaceholder: 'db_name',
                },
                {
                    name: 'user',
                    alias: 'u',
                    description: "The user name of the MySQL account to use for connecting to the server.",
                    defaultValue: () => userInfo().username,
                    valuePlaceholder: 'user_name',
                },
                {
                    name: 'password',
                    alias: 'p',
                    description: "The password of the MySQL account used for connecting to the server.",
                },
            ]
        }
    ]
})
