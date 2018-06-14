import Ajv from 'ajv';
import tableSchema from '../table.schema';
import dump from '../dump';


export default function Validator() {

    const ajv = new Ajv({
        allErrors: true,
        $data: true,
        extendRefs: 'fail',
    });
    ajv.addSchema(tableSchema,'root');
    
    return {
        validate(schema) {
            if(!ajv.validate('root#/defs/Table',schema)) {
                return ajv.errors;
            }
            return null;
        },
    }
}