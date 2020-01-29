import fs from 'fs';
import { notEmpty } from './validators';
import { InquirerQuestions } from './prompt';

export const TypechainSettingsQuestions = (force: boolean): InquirerQuestions => ({
  typechainTarget: {
    message: 'Typechain compilation target',
    type: 'list',
    choices: [
      { name: 'web3-v1 compatible', value: 'web3-v1' },
      { name: 'truffle-contract compatible', value: 'truffle' },
      { name: 'ethers.js compatible', value: 'ethers' },
    ],
    when: ({ typechainEnabled }) => typechainEnabled || force,
  },
  typechainOutdir: {
    message: 'Typechain output directory',
    type: 'input',
    validate: notEmpty,
    default: './types/contracts/',
    when: ({ typechainEnabled }) => typechainEnabled || force,
  },
});

export const TypechainQuestions: InquirerQuestions = {
  typechainEnabled: {
    message: 'Enable typechain support?',
    type: 'confirm',
    default: true,
    when: () => fs.existsSync('tsconfig.json'),
  },
  ...TypechainSettingsQuestions(false),
};
