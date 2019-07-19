import { ZWeb3, Loggy } from '@openzeppelin/upgrades';

export default async function accounts({ network }: { network: string }): Promise<void | never> {
  const defaultAccount = await ZWeb3.defaultAccount();
  const accounts = await ZWeb3.accounts();

  if (accounts && accounts.length !== 0) {
    Loggy.noSpin(__filename, `accounts`, `network-name`, `Accounts for ${network}:`);
    Loggy.noSpin(__filename, `accounts`, `default-account`, `Default: ${defaultAccount}`);
    Loggy.noSpin(
      __filename,
      `accounts`,
      `all-accounts`,
      `All:\n${accounts.map((account, index) => `- ${index}: ${account}`).join('\n')}`,
    );
  } else {
    Loggy.noSpin(__filename, `accounts`, `accounts-msg`, `There are no accounts for ${network}`);
  }
}
