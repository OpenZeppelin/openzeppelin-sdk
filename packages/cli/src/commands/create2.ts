import pickBy from 'lodash.pickby';

import { TxParams } from '@openzeppelin/upgrades';

import create from '../scripts/create';
import { CreateParams } from '../scripts/interfaces';
import queryDeployment from '../scripts/query-deployment';
import querySignedDeployment from '../scripts/query-signed-deployment';
import { parseMethodParams } from '../utils/input';
import { fromContractFullName } from '../utils/naming';
import { hasToMigrateProject } from '../prompts/migrations';
import ConfigManager from '../models/config/ConfigManager';
import Telemetry from '../telemetry';

const name = 'create2';
const signature = `${name} [alias]`;
const description =
  'deploys a new upgradeable contract instance using CREATE2 at a predetermined address given a numeric <salt> and a <from> address. Provide the <alias> you added your contract with, or <package>/<alias> to create a contract from a linked package. A <signature> can be provided to derive the deployment address from a signer different to the <from> address. Warning: support for this feature is experimental.';

const register: (program: any) => any = program =>
  program
    .command(signature, undefined, { noHelp: true })
    .usage('[alias] --network <network> --salt <salt> [options]')
    .description(description)
    .option('--salt <salt>', `salt used to determine the deployment address (required)`)
    .option(
      '--query [sender]',
      `do not create the contract and just return the deployment address, optionally specifying the sender used to derive the deployment address (defaults to 'from')`,
    )
    .option(
      '--init [function]',
      `initialization function to call after creating contract (defaults to 'initialize', skips initialization if not set)`,
    )
    .option('--args <arg1, arg2, ...>', 'arguments to the initialization function')
    .option('--admin <admin>', "admin of the proxy (uses the project's proxy admin if not set)")
    .option(
      '--signature <signature>',
      `signature of the request, uses the signer to derive the deployment address (uses the sender to derive deployment address if not set)`,
    )
    .option('--force', 'force creation even if contracts have local modifications')
    .withNetworkOptions()
    .action(action);

async function action(contractFullName: string, options: any): Promise<void> {
  const { network, txParams } = await ConfigManager.initNetworkConfiguration(options);
  if (!(await hasToMigrateProject(network))) process.exit(0);
  if (!options.salt) throw new Error("option `--salt' is required");

  const { methodName, methodArgs } = parseMethodParams(options, 'initialize');
  const { contract: contractAlias, package: packageName } = fromContractFullName(contractFullName);
  const opts = {
    ...options,
    methodName,
    methodArgs,
    contractAlias,
    packageName,
  };

  await Telemetry.report('create2', { ...opts, network, txParams }, options.interactive);

  if (options.query && options.signature) await runSignatureQuery(opts, network, txParams);
  else if (options.query) await runQuery(opts, network, txParams);
  else await runCreate(opts, network, txParams);

  if (!options.dontExitProcess && process.env.NODE_ENV !== 'test') process.exit(0);
}

export default { name, signature, description, register, action };

async function runQuery(options: any, network: string, txParams: TxParams) {
  const sender = typeof options.query === 'boolean' ? null : options.query;
  await queryDeployment({ salt: options.salt, sender, network, txParams });
}

async function runSignatureQuery(options: any, network: string, txParams: TxParams) {
  const {
    query,
    methodName,
    methodArgs,
    contractAlias,
    packageName,
    force,
    salt,
    signature: signatureOption,
    admin,
  } = options;
  if (!contractAlias) throw new Error('missing required argument: alias');
  if (typeof query === 'string') throw new Error("cannot specify argument `sender' as it is inferred from `signature'");
  const args = pickBy({
    packageName,
    contractAlias,
    methodName,
    methodArgs,
    force,
    salt,
    signature: signatureOption,
    admin,
  } as CreateParams);
  await querySignedDeployment({ ...args, network, txParams });
}

async function runCreate(options: any, network: string, txParams: TxParams) {
  const {
    methodName,
    methodArgs,
    contractAlias,
    packageName,
    force,
    salt,
    signature: signatureOption,
    admin,
  } = options;
  if (!contractAlias) throw new Error('missing required argument: alias');
  const args = pickBy({
    packageName,
    contractAlias,
    methodName,
    methodArgs,
    force,
    salt,
    signature: signatureOption,
    admin,
  } as CreateParams);
  await create({ ...args, network, txParams });
}
