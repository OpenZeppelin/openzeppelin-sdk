import { Command } from 'commander';

import { generateSignature, register as _register } from '../../register-command';

import * as spec from './spec';

export { name, description } from './spec';

export const signature = generateSignature(spec.name, spec.args);

export function register(program: Command) {
  _register(program, spec, () => import('./action'));
}
