import { Option } from '../register-command';

interface Options {
  [key: string]: Option;
}

export const commonOptions: Options = {
  noInteractive: {
    format: '--no-interactive',
    description: 'disable interactive prompts',
  },
};
