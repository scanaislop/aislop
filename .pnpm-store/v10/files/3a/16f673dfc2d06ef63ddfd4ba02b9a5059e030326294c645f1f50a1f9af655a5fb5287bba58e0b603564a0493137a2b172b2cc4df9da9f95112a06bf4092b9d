import {env} from 'node:process';

const check = key => key in env && env[key] !== '0' && env[key] !== 'false';

const isInCi = check('CI') || check('CONTINUOUS_INTEGRATION');

export default isInCi;
