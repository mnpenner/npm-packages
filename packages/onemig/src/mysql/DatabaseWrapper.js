import DbConnectionPool from 'mysql3';

export default class extends DbConnectionPool {
    
    constructor(options) {
        super({
            timezone: 'America/Vancouver',
            foreignKeyChecks: false, // must be disabled because the tables might not be created in the correct order... and even if we could resolve a dependency tree, there's still the chance there are circular references.
            sqlMode: [
                'ONLY_FULL_GROUP_BY',
                'STRICT_TRANS_TABLES',
                'STRICT_ALL_TABLES',
                'NO_ZERO_IN_DATE',
                'NO_ZERO_DATE', // apparently this is used.... wx_cldsl_pcs.fw_doc_ver_date
                'ERROR_FOR_DIVISION_BY_ZERO',
                // 'NO_AUTO_CREATE_USER', // not allowed in MySQL 8
                'NO_ENGINE_SUBSTITUTION',
                'NO_UNSIGNED_SUBTRACTION',
                'PAD_CHAR_TO_FULL_LENGTH',
            ],
            ...options
        });
    }
    
    escapeValue(value) {
        return super.escape(value);
    }
}

export function escapeIdString(id) {
    return '`' + String(id).replace(/`/g,'``') + '`';
}
