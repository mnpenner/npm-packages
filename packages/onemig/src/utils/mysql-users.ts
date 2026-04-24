import {ConnectionPool, sql} from '../mysql.ts'
import {groupBy, toBool} from './utils'


// const PRIVILEGES = ['Select','Insert','Update','Delete','Create','Drop','Reload','Shutdown','Process','File','References','Index','Alter','Show_db','Super','Create_tmp_table','Lock_tables','Execute','Repl_slave','Repl_client','Create_view','Show_view','Create_routine','Alter_routine','Create_user','Event','Trigger','Create_tablespace','Delete_history']


/**
 * https://dev.mysql.com/doc/refman/8.0/en/grant.html
 * https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html
 */
const GRANTS: Record<string, string> = {
    /** Enable use of ALTER TABLE. Levels: Global, database, table. */
    'Alter_priv': 'ALTER',
    /** Enable stored routines to be altered or dropped. Levels: Global, database, routine. */
    'Alter_routine_priv': 'ALTER ROUTINE',
    /** Enable database and table creation. Levels: Global, database, table. */
    'Create_priv': 'CREATE',
    /** Enable role creation. Level: Global. */
    'Create_role_priv': 'CREATE ROLE',
    /** Enable stored routine creation. Levels: Global, database. */
    'Create_routine_priv': 'CREATE ROUTINE',
    /** Enable tablespaces and log file groups to be created, altered, or dropped. Level: Global. */
    'Create_tablespace_priv': 'CREATE TABLESPACE',
    /** Enable use of CREATE TEMPORARY TABLE. Levels: Global, database. */
    'Create_tmp_table_priv': 'CREATE TEMPORARY TABLES',
    /** Enable use of CREATE USER, DROP USER, RENAME USER, and REVOKE ALL PRIVILEGES. Level: Global. */
    'Create_user_priv': 'CREATE USER',
    /** Enable views to be created or altered. Levels: Global, database, table. */
    'Create_view_priv': 'CREATE VIEW',
    /** Enable use of DELETE. Level: Global, database, table. */
    'Delete_priv': 'DELETE',
    /** Enable databases, tables, and views to be dropped. Levels: Global, database, table. */
    'Drop_priv': 'DROP',
    /** Enable roles to be dropped. Level: Global. */
    'Drop_role_priv': 'DROP ROLE',
    /** Enable use of events for the Event Scheduler. Levels: Global, database. */
    'Event_priv': 'EVENT',
    /** Enable the user to execute stored routines. Levels: Global, database, routine. */
    'Execute_priv': 'EXECUTE',
    /** Enable the user to cause the server to read or write files. Level: Global. */
    'File_priv': 'FILE',
    /** Enable privileges to be granted to or removed from other accounts. Levels: Global, database, table, routine, proxy. */
    'Grant_priv': 'GRANT OPTION',
    /** Enable indexes to be created or dropped. Levels: Global, database, table. */
    'Index_priv': 'INDEX',
    /** Enable use of INSERT. Levels: Global, database, table, column. */
    'Insert_priv': 'INSERT',
    /** Enable use of LOCK TABLES on tables for which you have the SELECT privilege. Levels: Global, database. */
    'Lock_tables_priv': 'LOCK TABLES',
    /** Enable the user to see all processes with SHOW PROCESSLIST. Level: Global. */
    'Process_priv': 'PROCESS',
    /** Enable user proxying. Level: From user to user. */
    // 'xxxxxxxxxxxxxxxxx': 'PROXY',
    /** Enable foreign key creation. Levels: Global, database, table, column. */
    'References_priv': 'REFERENCES',
    /** Enable use of FLUSH operations. Level: Global. */
    'Reload_priv': 'RELOAD',
    /** Enable the user to ask where source or replica servers are. Level: Global. */
    'Repl_client_priv': 'REPLICATION CLIENT',
    /** Enable replicas to read binary log events from the source. Level: Global. */
    'Repl_slave_priv': 'REPLICATION SLAVE',
    /** Enable use of SELECT. Levels: Global, database, table, column. */
    'Select_priv': 'SELECT',
    /** Enable SHOW DATABASES to show all databases. Level: Global. */
    'Show_db_priv': 'SHOW DATABASES',
    /** Enable use of SHOW CREATE VIEW. Levels: Global, database, table. */
    'Show_view_priv': 'SHOW VIEW',
    /** Enable use of mysqladmin shutdown. Level: Global. */
    'Shutdown_priv': 'SHUTDOWN',
    /** Enable use of other administrative operations such as CHANGE REPLICATION SOURCE TO, CHANGE MASTER TO, KILL, PURGE BINARY LOGS, SET GLOBAL, and mysqladmin debug command. Level: Global. */
    'Super_priv': 'SUPER',
    /** Enable trigger operations. Levels: Global, database, table. */
    'Trigger_priv': 'TRIGGER',
    /** Enable use of UPDATE. Levels: Global, database, table, column. */
    'Update_priv': 'UPDATE',
    /** Synonym for “no privileges” */
    // 'xxxxxxxxxxxxxxxxx': 'USAGE',
    /** Can delete rows created through system versioning. */
    'Delete_history_priv': 'DELETE HISTORY',
}

const TABLE_PRIVILEGES: Record<string,string> = {
    Select: 'SELECT',
    Insert: 'INSERT',
    Update: 'UPDATE',
    Delete: 'DELETE',
    Create: 'CREATE',
    Drop: 'DROP',
    Grant: 'GRANT',
    References: 'REFERENCES',
    Index: 'INDEX',
    Alter: 'ALTER',
    'Create View': 'CREATE VIEW',
    'Show view': 'SHOW VIEW',
    Trigger: 'TRIGGER',
    'Delete versioning rows': 'DELETE HISTORY',
}

function makeDbKey(x: Record<string, any>) {
    return JSON.stringify([x.User.trimEnd(), x.Host.trimEnd()])
}


export async function getMysqlUsers(conn: ConnectionPool) {

    const users = await conn.query<Record<string, string>>(sql`select *
                                                                       from mysql.user`)

    if (!users.length) throw new Error("No users")
    const rawDb = await conn.query<Record<string, string>>(sql`select *
                                                                       from mysql.db`)
    const rawTablePrivileges = await conn.query<Record<string, string>>(sql`select *
                                                                                    from mysql.tables_priv`)

    let DB_PRIVILEGES: string[] = []
    if (rawDb.length) {
        const {Grant_priv: __unused2, ...otherDbPriv} = rawDb[0]
        DB_PRIVILEGES = Object.keys(otherDbPriv).filter(k => k.endsWith('_priv'))
    }

    const userDb = groupBy(rawDb, makeDbKey)
    const allTablePrivs = groupBy(rawTablePrivileges, makeDbKey)

    // console.log(userDb)
    // console.log(users)

    const {Grant_priv: __unused1, ...otherUserPriv} = users[0]
    const USER_PRIVILEGES = Object.keys(otherUserPriv).filter(k => k.endsWith('_priv'))

    const out: any[] = []
    for (const rawUser of users) {
        const outUser: Record<string, any> = {}
        outUser.name = rawUser.User.trimEnd()
        outUser.host = rawUser.Host.trimEnd()
        outUser.grantOption = toBool(rawUser.Grant_priv)

        const privileges = []


        for (const priv of USER_PRIVILEGES) {
            if (toBool(rawUser[priv])) {
                if (!GRANTS[priv]) throw new Error(`No mapping for privilege '${priv}'`)
                privileges.push(GRANTS[priv])
            }
        }

        if (!privileges.length) {
            outUser.privileges = 'NONE'
        } else if (privileges.length === USER_PRIVILEGES.length) {
            outUser.privileges = 'ALL'
        } else {
            outUser.privileges = privileges
        }

        // ou.privileges = {
        //     select : toBool(user.Select_priv),
        //     insert : toBool(user.Insert_priv),
        //     update : toBool(user.Update_priv),
        //     delete : toBool(user.Delete_priv),
        //     create : toBool(user.Create_priv),
        //     drop : toBool(user.Drop_priv),
        //     reload : toBool(user.Reload_priv),
        //     shutdown : toBool(user.Shutdown_priv),
        //     process : toBool(user.Process_priv),
        //     file : toBool(user.File_priv),
        //     references : toBool(user.References_priv),
        //     index : toBool(user.Index_priv),
        //     alter : toBool(user.Alter_priv),
        //     showDb : toBool(user.Show_db_priv),
        //     super : toBool(user.Super_priv),
        //     createTmpTable : toBool(user.Create_tmp_table_priv),
        //     lockTables : toBool(user.Lock_tables_priv),
        //     execute : toBool(user.Execute_priv),
        //     replSlave : toBool(user.Repl_slave_priv),
        //     replClient : toBool(user.Repl_client_priv),
        //     createView : toBool(user.Create_view_priv),
        //     showView : toBool(user.Show_view_priv),
        //     createRoutine : toBool(user.Create_routine_priv),
        //     alterRoutine : toBool(user.Alter_routine_priv),
        //     createUser : toBool(user.Create_user_priv),
        //     event : toBool(user.Event_priv),
        //     trigger : toBool(user.Trigger_priv),
        //     createTablespace : toBool(user.Create_tablespace_priv),
        //     deleteHistory : toBool(user.Delete_history_priv),
        // }
        // if(Object.values(ou.privileges).every(Boolean)) {
        //     ou.privileges = 'ALL'
        // } else if(!Object.values(ou.privileges).some(Boolean)) {
        //     ou.privileges = 'NONE'
        // }

        if (rawUser.authentication_string) {
            if (rawUser.plugin === 'mysql_native_password') {
                outUser.password = rawUser.authentication_string
            } else {
                outUser.auth = {
                    plugin: rawUser.plugin,
                    secret: rawUser.authentication_string,
                    // passwordExpired: toBool(user.password_expired),
                }
            }
        }
        const tls = {
            sslType: rawUser.ssl_type,
            sslCipher: rawUser.ssl_cipher,
            x509Issuer: rawUser.x509_issuer,
            x509Subject: rawUser.x509_subject,
        }
        if (Object.values(tls).some(Boolean)) {
            outUser.tls = tls
        }
        if (toBool(rawUser.is_role)) {
            outUser.isRole = true
        }

        if (rawDb.length) {
            const dbPerms = userDb.get(makeDbKey(rawUser))
            if (dbPerms) {
                outUser.databasePrivileges = {}
                for (const dbPriv of dbPerms) {
                    const dbName = dbPriv.Db.trimEnd()
                    const privileges: string[] = []
                    for (const priv of DB_PRIVILEGES) {
                        if (toBool(dbPriv[priv])) {
                            if (!GRANTS[priv]) throw new Error(`No mapping for privilege '${priv}'`)
                            privileges.push(GRANTS[priv])
                        }
                    }

                    if (!privileges.length) {
                        outUser.databasePrivileges[dbName] = 'NONE'
                    } else if (privileges.length === USER_PRIVILEGES.length) {
                        outUser.databasePrivileges[dbName] = 'ALL'
                    } else {
                        outUser.databasePrivileges[dbName] = privileges
                    }
                }
            }
        }

        const tblPrivs = allTablePrivs.get(makeDbKey(rawUser))
        if (tblPrivs) {
            outUser.tablePrivileges = {}
            for (const tblPriv of tblPrivs) {
                const dbName = tblPriv.Db.trimEnd()
                const tblName = tblPriv.Table_name.trimEnd()
                outUser.tablePrivileges[dbName] ??= {}
                outUser.tablePrivileges[dbName][tblName] = tblPriv.Table_priv.map(p => {
                    if (TABLE_PRIVILEGES[p]) {
                        return TABLE_PRIVILEGES[p]
                    }
                    throw new Error(`Unknown privilege: ${p}`)
                })
            }
        }


        out.push(outUser)
    }

    const grouped = groupBy(out, ({host, ...user}) => JSON.stringify(user))

    const real = Array.from(grouped.values()).map(users => ({
        ...users[0],
        host: users.length === 1 ? users[0].host : users.map(u => u.host),
    }))

    return real
}
