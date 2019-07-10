import Transactions from './Transactions';
import encodeCall from '../helpers/encodeCall';
import { Loggy } from '../utils/Logger';
import { TxParams } from '../artifacts/ZWeb3';

export default async function migrate(
  appAddress: string,
  proxyAddress: string,
  proxyAdminAddress: string,
  txParams: TxParams = {},
): Promise<void> {
  const data = encodeCall('changeProxyAdmin', ['address', 'address'], [proxyAddress, proxyAdminAddress]);
  Loggy.spin(__filename, 'migrate', 'migrate-version', `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`);
  await Transactions.sendRawTransaction(appAddress, { data }, { ...txParams });
  Loggy.succeed('migrate-version', `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`);
}
