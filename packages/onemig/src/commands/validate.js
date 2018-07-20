import dump from '../dump';
import readSchema from '../schema/readSchema';
import Chalk from 'chalk';

export default {
    name: "validate",
    description: "Validate schemas",
    options: [
        // {
        //     name: 'dir',
        //     alias: 'd',
        //     description: "Source directory of struct JSON relative to current working directory",
        //     value: InputOption.Required,
        //     default: 'out',
        // },
    ],
    async execute(args, opts) {
        if(!args[0]) throw new Error("Please specify a directory to check");


        const tableMap = new Map;
        let errorCount = 0;
        
        for(const inputDir of args) {
            const tables = await readSchema(inputDir);

            for(let tbl of tables.values()) {
                for(let {databases} of tbl.versions) {
                    for(let dbName of databases) {
                        const key = JSON.stringify([dbName,tbl.name]);
                        if(tableMap.has(key)) {
                            console.log(`${Chalk.bold(dbName)}.${Chalk.bold(tbl.name)} already has a definition in ${Chalk.underline(tableMap.get(key))}; found another definition in ${Chalk.underline(tbl.filename)}`)
                            ++errorCount;
                        } else {
                            tableMap.set(key,tbl.filename);
                        }
                    }
                }

            }
        }

        // TODO: warnings
        // process.stderr.write(`Foreign key ${dbName}.${tblName}.${fk.constraintName} on ${fk.columnName} points to another database ${fk.refDatabase}`);
        // process.stderr.write(`${dbName}.${tblName} does not have a PRIMARY key\n`);
        if(errorCount > 0) {
            console.log(`Found ${errorCount} errors`);
            return 1;
        }
        
        return 0;
    }
}
