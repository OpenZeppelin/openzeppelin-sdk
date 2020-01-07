import { Question, Arg, Option, ArgsAndOpts } from '../../register-command';
import { MethodArg } from '../../prompts/prompt';

export const name = 'deploy';
export const description = 'deploy a contract instance';

export const args: Arg[] = [
  {
    name: 'contract',
    async prompt(): Promise<Question> {
      const choices = await import('../../prompts/choices');

      // TODO: Make this include contracts from _unlinked_ dependencies.
      const contracts = choices.contracts('all');

      return {
        message: 'Pick a contract to deploy',
        choices: contracts,
        validate: value => contracts.includes(value),
      };
    },
  },
  {
    name: 'arguments',
    variadic: true,
    async prompt(argsAndOpts: ArgsAndOpts): Promise<Question[]> {
      const { fromContractFullName } = await import('../../utils/naming');
      const { default: ContractManager } = await import('../../models/local/ContractManager');
      const { argLabel } = await import('../../prompts/prompt');
      const { parseArg, getSampleInput } = await import('../../utils/input');

      const contractName = argsAndOpts.contract as string;

      const { package: packageName, contract: contractAlias } = fromContractFullName(contractName);
      const contract = new ContractManager().getContractClass(packageName, contractAlias);
      const constructorInputs: MethodArg[] = contract.schema.abi.find(f => f.type === 'constructor')?.inputs ?? [];

      return constructorInputs.map((arg, index) => {
        const placeholder = getSampleInput(arg);
        const validationError = placeholder
          ? `Enter a valid ${arg.type} such as: ${placeholder}`
          : `Enter a valid ${arg.type}`;

        return {
          message: `${argLabel(arg, index)}:`,
          validate: (value: string) => {
            try {
              parseArg(value, arg);
              return true;
            } catch (err) {
              return false;
            }
          },
          validationError,
        };
      });
    },
  },
];

export const options: Option[] = [
  {
    format: '--no-interactive',
    description: 'disable interactive prompts',
  },
  {
    format: '--skip-compile',
    description: 'use existing compilation artifacts',
    default: false,
  },
  {
    format: '--upgradeable',
    description: 'deploy an upgradeable instance',
    default: false,
  },
  {
    format: '-n, --network <network>',
    description: 'network to use',
    async prompt(): Promise<Question> {
      const { default: ConfigManager } = await import('../../models/config/ConfigManager');
      const networks = ConfigManager.getNetworkNamesFromConfig();
      return {
        message: 'Pick a network',
        choices: networks,
        validate: value => networks.includes(value),
      };
    },
  },
];
