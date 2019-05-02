import Transactions from './Transactions';
import encodeCall from '../helpers/encodeCall';
import Logger from '../utils/Logger';

const log: Logger = new Logger('Migrator');

export default async function migrate(appAddress: string, proxyAddress: string, proxyAdminAddress: string, txParams: any = {}): Promise<void> {
  const data = encodeCall('changeProxyAdmin', ['address', 'address'], [proxyAddress, proxyAdminAddress]);
  await Transactions.sendRawTransaction(appAddress, { data }, { ...txParams });
  log.info(`Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`);
}
