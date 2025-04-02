import { Request, Response } from 'express';
import Ajv from 'ajv';
import { ValidateFunction } from 'ajv';
import { properties as schemas } from './validate_data.json';


const ajv = new Ajv({ coerceTypes: true });

let validates = new Map<string, ValidateFunction>();

function getCompileValidate(name: string): ValidateFunction {
    let validate = validates.get(name);
    if (!validate) {
        let schema = (schemas as any)[name];
        if (!schema) {
            throw new Error(`not support schema: ${name}`);
        }
        validate = ajv.compile(schema);
        validates.set(name, validate);
    }
    return validate;
}

function getValidateQuery(name: string): (req: Request, resp: Response, next: () => void) => void {
    let validate = getCompileValidate(name);
    return (req: Request, res: Response, next: () => void) => {
        let valid = false;
        if (req.method == "POST") {
            valid = validate(req.body);
        } else {
            valid = validate(req.query);
        }
        if (!valid) {
            return res.status(400).json({ error: (validate.errors as any)[0].message });
        }
        next();
    };
}

export default getValidateQuery;
