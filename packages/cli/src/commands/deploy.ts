import { Command } from 'commander';

const name = 'deploy';

export const signature = `${name} [contract]`;

export function register(program: Command): void {
  return program
  .command(signature)
  .description('deploy a contract instance')
}
