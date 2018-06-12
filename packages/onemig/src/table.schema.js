import COLLATIONS from './mysql-collations';
const CASCADE_RULES = ['RESTRICT', 'CASCADE', 'SET NULL', 'NO ACTION', 'SET DEFAULT'];



function makeColumn(type, properties, required = []) {
    return {
        type: "object",
        additionalProperties: false,
        properties: {
            name: {$ref: "#/defs/Identifier"},
            oldName: {$ref: "#/defs/OldName"},
            type: Array.isArray(type) ? {enum: type} : {const: type},
            null: {type: "boolean",default:false},
            comment: {$ref: "#/defs/Comment"},
            ...properties,
        },
        required: ["name", "type", ...required],
    }
}

function tuple(...schemas) {
    return {
        type: 'array',
        items: schemas,
        minItems: schemas.length,
        maxItems: schemas.length,
        // additionalItems: false,
    }
}

const columnTypes = [
    makeColumn(['tinyint', 'smallint', 'mediumint', 'int', 'bigint'], {
        default: {$ref: "#/defs/Int"},
        unsigned: {type: "boolean",default:false},
        autoIncrement: {type: "boolean",default:false},
        zerofill: {
            type: "integer",
            minimum: 1,
            maximum: 255,
        },
    }),
    makeColumn(['float','double'], {
        default: {$ref: "#/defs/Float"},
        unsigned: {type: "boolean",default:false},
        zerofill: {type: "boolean",default:false},
        autoIncrement: {type: "boolean",default:false}, // apparently this works
        precision: tuple(
            {type: 'integer',minimum:1,maximum:255},
            {type: 'integer',minimum:0,maximum:{$data:'1/0'}}
        )
    }),
    makeColumn('decimal', {
        default: {$ref: "#/defs/Float"},
        unsigned: {type: "boolean",default:false},
        zerofill: {type: "boolean",default:false},
        precision: tuple(
            {type: 'integer',minimum:1,maximum:65,default:10},
            {type: 'integer',minimum:0,allOf: [{maximum:30},{maximum:{$data:'1/0'}}],default:0}
        )
    },['precision']),
    makeColumn(['char', 'varchar'], {
        default: {type: 'string'},
        collation: {$ref: "#/defs/Collation"},
        length: {
            type: 'integer',
            minimum: 1,
            maximum: 4294967295,
        }
    }, ['length']),
    makeColumn(['binary', 'varbinary'], {
        default: {type: 'string'},
        length: {
            type: 'integer',
            minimum: 1,
            maximum: 4294967295,
        }
    }, ['length']),
    makeColumn('bit', {
        default: {anyOf: [{type: 'string',pattern:String.raw`^b'[01]+'$`},{type: 'integer',minimum:0}]},
        length: {
            type: 'integer',
            minimum: 1,
            maximum: 64,
            default: 1,
        }
    }),
    makeColumn(['tinytext', 'text', 'mediumtext', 'longtext'], {
        default: {type: 'string'},
        collation: {$ref: "#/defs/Collation"},
    }),
    makeColumn('year', {
        width: {enum: [2, 4]},
        default: {
            anyOf: [
                {
                    type: 'string',
                    pattern: String.raw`^(19\d{2}|2[01]\d{2})$`,
                },
                {
                    type: 'integer',
                    minimum: 1901,
                    maximum: 2155,
                }
            ]
        }
    }),
    makeColumn('date', {
        default: {
            type: 'string',
            pattern: String.raw`^\d{4}-\d{2}-\d{2}$`,
        }
    }),
    makeColumn('time', {
        default: {
            type: 'string',
            pattern: String.raw`^\d{2}:\d{2}:\d{2}$`,
        }
    }),
    makeColumn(['datetime', 'timestamp'], {
        default: {
            type: 'string',
            anyOf: [
                {const: 'CURRENT_TIMESTAMP'},
                {pattern: String.raw`^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$`}
            ],
        }
    }),
    makeColumn(['tinyblob', 'blob', 'mediumblob', 'longblob'], {
        default: {type: 'string'},
    }),
    makeColumn('enum', {
        collation: {$ref: "#/defs/Collation"},
        default: {type: 'string'},
        values: {
            type: 'array',
            minItems: 1,
            maxItems: 65535,
            uniqueItems: true,
            items: {type: 'string'}
        }
    }, ['values']),
    makeColumn('set', {
        collation: {$ref: "#/defs/Collation"},
        default: {type: 'string'},
        values: {
            type: 'array',
            minItems: 1,
            maxItems: 64,
            uniqueItems: true,
            items: {type: 'string'}
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
                comment: {$ref: "#/defs/Comment"},
                collation: {$ref: "#/defs/Collation"},
            },
        },
        Comment: {
            type: 'string',
            maxLength: 1024,
        },
        Int: {
            anyOf: [
                {
                    type: "integer",
                },
                {
                    type: "string",
                    pattern: String.raw`^(0|-?[1-9]\d*)$`
                }
            ]
        },
        NonNegInt: {
            anyOf: [
                {
                    type: "integer",
                    minimum: 0
                },
                {
                    type: "string",
                    pattern: String.raw`^(0|[1-9]\d*)$`
                }
            ]
        },
        PosInt: {
            anyOf: [
                {
                    type: "integer",
                    minimum: 1
                },
                {
                    type: "string",
                    pattern: String.raw`^[1-9]\d*$`
                }
            ]
        },
        Float: {
            anyOf: [
                {
                    type: "number",
                },
                {
                    type: "string",
                    pattern: String.raw`^-?(\d+(\.\d*)?|\.\d+)$`
                },
            ]
        },
        Collation: {enum: COLLATIONS},
        Identifier: {type: "string", minLength: 1, maxLength: 64},
        OldName: {
            anyOf: [
                {$ref: "#/defs/Identifier"},
                {
                    type: 'array',
                    minItems: 1,
                    items: {$ref: "#/defs/Identifier"}
                }
            ]
        },
        Index: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: {$ref: "#/defs/Identifier"},
                oldName: {$ref: "#/defs/OldName"},
                type: {enum: ['PRIMARY', 'INDEX', 'UNIQUE', 'FULLTEXT']},
                comment: {$ref: "#/defs/Comment"},
                columns: {
                    type: "array",
                    items: {type: "string"},
                    minItems: 1
                },
            },
            required: ["columns", "name", "type"],
            // if: {
            //     properties: {
            //         type: {const:'PRIMARY'},
            //     }
            // },
            // then: {
            //     required: ["columns", "type"],
            //     properties: {
            //         name: {const:"PRIMARY"}
            //     }
            // }
        },
        ForeignKey: {
            type: "object",
            additionalProperties: false,
            properties: {
                name: {$ref: "#/defs/Identifier"},
                oldName: {$ref: "#/defs/OldName"},
                columns: {
                    type: "array",
                    items: {$ref: "#/defs/Identifier"},
                    minItems: 1
                },
                refTable: {type: "string"},
                refColumns: {
                    type: "array",
                    items: {$ref: "#/defs/Identifier"},
                    minItems: 1
                },
                onDelete: {enum: CASCADE_RULES},
                onUpdate: {enum: CASCADE_RULES},
                refDatabase: {
                    anyOf: [{$ref: "#/defs/AppRef"}, {$ref: "#/defs/Identifier"}],
                },
            },
            required: ["columns", "onDelete", "name", "refColumns", "refTable", "onUpdate"],
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
