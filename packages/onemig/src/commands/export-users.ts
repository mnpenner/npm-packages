import {sql} from "mysql3"
import {Command, OptType} from "clap"
import {createConnection, dbOptions} from "../db"
import highlight from 'cli-highlight'
import {dump} from 'js-yaml'
import {promises as fs} from 'fs'
import {groupBy, toBool} from '../utils/utils'
import {getMysqlUsers} from '../utils/mysql-users'
import {dumpYaml} from '../struct'


const cmd: Command = {
    name: "export-users",
    alias: 'xu',
    description: "Export users in YAML format",
    async execute(opts, args) {
        const startTime = Date.now()
        const conn = await createConnection(opts)
        try {
            const users = await getMysqlUsers(conn)

            const yaml = dumpYaml(users)

            if (args.length) {
                await fs.writeFile(args[0], yaml)
            } else {
                console.log(highlight(yaml, {language: 'yaml', ignoreIllegals: true}))
            }
        } finally {
            conn.close()
        }


    },
    options: [
        ...dbOptions,

    ],
    flags: [],
    arguments: [
        {
            name: 'outfile',
            type: OptType.OUTPUT_FILE,
            required: false,
            description: "YAML file to write",
        }
    ]
}

export default cmd

