import COLLATIONS from './mysql-collations';

function makeColumn(type, properties, required = []) {
    return {
        type: "object",
        additionalProperties: false,
        properties: {
            name: {$ref: "#/defs/Identifier"},
            oldName: {$ref: "#/defs/Identifier"},
            type: Array.isArray(type) ? {enum: type} : {const: type},
            null: {type: "boolean",default:false},
            comment: {type: "string"},
            ...properties,
        },
        required: ["name", "type", ...required],
    }
}

const columnTypes = [
    makeColumn(['tinyint', 'smallint', 'mediumint', 'int', 'bigint'], {
        default: {$ref: "#/defs/Int"},
        unsigned: {type: "boolean",default:false},
        zerofill: {
            type: "integer",
            minimum: 1,
            maximum: 255,
        },
    }),
    makeColumn(['char', 'varchar'], {
        default: {type: 'string'},
        collation: {$ref: "#/defs/Collation"},
        length: {
            type: 'integer',
            minimum: 1,
            maximum: 4294967295,
        }
    }, ['length']),
    makeColumn(['tinytext', 'text', 'mediumtext', 'longtext'], {
        default: {type: 'string'},
        collation: {$ref: "#/defs/Collation"},
    }),
    makeColumn('year', {
        width: {enum: [2, 4]},
    }),
    makeColumn(['tinyblob', 'blob', 'mediumblob', 'longblob'], {
        default: {type: 'string'},
    }),
    makeColumn(['enum', 'set'], {
        values: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'string',
            }
        }
    }, ['values']),
];

export default {
    $schema: "http://json-schema.org/draft-07/schema#",
    defs: {
        Table: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: {$ref: "#/defs/Identifier"},
                versions: {
                    type: "array",
                    items: {$ref: "#/defs/TableVersion"},
                },
            },
            required: ["name", "versions"],
        },
        TableVersion: {
            type: "object",
            additionalProperties: false,
            properties: {
                databases: {
                    type: "array",
                    items: {type: "string"},
                    minItems: 1,
                },
                options: {$ref: "#/defs/TableOptions"},
                columns: {
                    type: "array",
                    items: {anyOf: columnTypes},
                    minItems: 1,
                },
                indexes: {
                    type: "array",
                    items: {$ref: "#/defs/Index"},
                },
                foreignKeys: {
                    type: "array",
                    items: {$ref: "#/defs/ForeignKey"},
                },
            },
            required: ["columns", "databases", "foreignKeys", "indexes"],
        },
        TableOptions: {
            type: "object",
            additionalProperties: false,
            properties: {
                engine: {
                    enum: [
                        // "SHOW ENGINES"
                        'FEDERATED',
                        'MRG_MYISAM',
                        'MyISAM',
                        'BLACKHOLE',
                        'CSV',
                        'MEMORY',
                        'ARCHIVE',
                        'InnoDB',
                        'PERFORMANCE_SCHEMA',
                    ]
                },
                comment: {type: "string"},
                collation: {$ref: "#/defs/Collation"},
            },
        },

        Int: {
            type: {
                anyOf: [
                    {
                        type: "string",
                        pattern: "^(0|-?[1-9][0-9]*)$"
                    },
                    {
                        type: "integer",
                    }
                ]
            }
        },
        NonNegInt: {
            type: [
                {
                    type: "string",
                    pattern: "^(0|[1-9][0-9]*)$"
                },
                {
                    type: "integer",
                    minimum: 0
                }
            ]
        },
        PosInt: {
            type: [
                {
                    type: "string",
                    pattern: "^[1-9][0-9]*$"
                },
                {
                    type: "integer",
                    minimum: 1
                }
            ]
        },
        Collation: {enum: COLLATIONS},
        Identifier: {type: "string", minLength: 1, maxLength: 64},
        Index: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: {$ref: "#/defs/Identifier"},
                type: {enum: ['PRIMARY', 'INDEX', 'UNIQUE']},
                columns: {
                    type: "array",
                    items: {type: "string"},
                    minItems: 1
                },
            },
            required: ["columns", "name", "type"],
        },
        ForeignKey: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: {$ref: "#/defs/Identifier"},
                columnNames: {
                    type: "array",
                    items: {$ref: "#/defs/Identifier"},
                    minItems: 1
                },
                refTableName: {type: "string"},
                refColumnNames: {
                    type: "array",
                    items: {$ref: "#/defs/Identifier"},
                    minItems: 1
                },
                deleteRule: {enum: ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT']},
                updateRule: {enum: ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT']},
                refTableSchema: {
                    anyOf: [{$ref: "#/defs/AppRef"}, {$ref: "#/defs/Identifier"}],
                },
            },
            required: ["columnNames", "deleteRule", "name", "refColumnNames", "refTableName", "updateRule"],
        },
        AppRef: {
            type: "object",
            additionalProperties: false,
            properties: {$app: {type: "string"}},
            required: ["$app"],
        },
    },
};

function $ref(a) {
    return `#/defs/${a}`;
}
