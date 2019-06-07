import path from 'path';
import Transactions from './Transactions';
import encodeCall from '../helpers/encodeCall';
import Logger, { Loggy } from '../utils/Logger';
import { TxParams } from '../artifacts/ZWeb3';

const fileName = path.basename(__filename);
const log: Logger = new Logger('Migrator');

export default async function migrate(
  appAddress: string,
  proxyAddress: string,
  proxyAdminAddress: string,
  txParams: TxParams = {},
): Promise<void> {
  const data = encodeCall(
    'changeProxyAdmin',
    ['address', 'address'],
    [proxyAddress, proxyAdminAddress],
  );
  Loggy.add(
    `${fileName}#migrate`,
    'migrate-version',
    `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`,
  );
  await Transactions.sendRawTransaction(appAddress, { data }, { ...txParams });
  Loggy.succeed(
    'migrate-version',
    `Proxy ${proxyAddress} admin changed to ${proxyAdminAddress}`,
  );
}
