import Ajv from 'ajv';


export default function(schema, options) {
    const {$ref,...ajvOptions} = {
        allErrors: true,
        ...options,
    }
    const ajv = new Ajv(ajvOptions);
    ajv.addSchema(schema,'x');
    return {
        validate(data) {
            if(!ajv.validate(`x#${$ref}`,data)) {
                return ajv.errors;
            }
            return null;
        }
    }
}