import _ from 'lodash';
import { Logger } from 'zos-lib';

import ControllerFor from '../models/network/ControllerFor';
import NetworkController from '../models/network/NetworkController';
import ZosNetworkFile from '../models/files/ZosNetworkFile';
import { StatusParams }from './interfaces';

const log: Logger = new Logger('scripts/status');

export default async function status({ network, txParams = {}, networkFile }: StatusParams): Promise<void> {
  const controller = ControllerFor(network, txParams, networkFile);
  log.info(`Project status for network ${network}`);

  if (!(await appInfo(controller))) return;
  if (!(await versionInfo(controller.networkFile))) return;
  await dependenciesInfo(controller.networkFile);
  await contractsInfo(controller);
  await proxiesInfo(controller.networkFile);
}

// TODO: Find a nice home for all these functions :)
async function appInfo(controller: NetworkController): Promise<boolean> {
  if (!controller.isPublished) return true;

  if (!controller.appAddress) {
    log.warn(`Application is not yet deployed to the network`);
    return false;
  }

  await controller.fetchOrDeploy(controller.currentVersion);
  log.info(`Application is deployed at ${controller.appAddress}`);
  log.info(`- Package ${controller.packageFile.name} is at ${controller.networkFile.packageAddress}`);
  return true;
}

async function versionInfo(networkFile: ZosNetworkFile): Promise<boolean> {
  if (!networkFile.isPublished) return true;
  if (networkFile.hasMatchingVersion()) {
    log.info(`- Deployed version ${networkFile.version} matches the latest one defined`);
    return true;
  } else {
    log.info(`- Deployed version ${networkFile.version} is out of date (latest is ${networkFile.packageFile.version})`);
    return false;
  }
}

async function contractsInfo(controller: NetworkController): Promise<void> {
  log.info('Application contracts:');

  // Bail if there are no contracts at all
  if (!controller.packageFile.hasContracts() && !controller.networkFile.hasContracts()) {
    log.info(`- No contracts registered`);
    return;
  }

  // Log status for each contract in package file
  _.each(controller.packageFile.contracts, function(contractName, contractAlias) {
    const isDeployed = controller.isContractDeployed(contractAlias);
    const hasChanged = controller.hasContractChanged(contractAlias);
    const fullName = contractName === contractAlias ? contractAlias : `${contractAlias} (implemented by ${contractName})`;
    if (!isDeployed) {
      log.warn(`- ${fullName} is not deployed`);
    } else if (hasChanged) {
      log.error(`- ${fullName} is out of date with respect to the local version`);
    } else {
      log.info(`- ${fullName} is deployed and up to date`);
    }
  });

  // Log contracts in network file missing from package file
  controller.networkFile.contractAliasesMissingFromPackage()
    .forEach((contractAlias) => log.warn(`- ${contractAlias} will be removed on next push`));
}

async function dependenciesInfo(networkFile: ZosNetworkFile): Promise<void> {
  if (!networkFile.isPublished) return;
  const packageFile = networkFile.packageFile;
  if (!packageFile.hasDependencies() && !networkFile.hasDependencies()) return;
  log.info('Application dependencies:');

  _.forEach(packageFile.dependencies, (requiredVersion, dependencyName) => {
    const msgHead = `- ${dependencyName}@${requiredVersion}`;
    if (!networkFile.hasDependency(dependencyName)) {
      log.info(`${msgHead} is required but is not linked`);
    } else if (networkFile.dependencyHasMatchingCustomDeploy(dependencyName)) {
      log.info(`${msgHead} is linked to a custom deployment`);
    } else if (networkFile.dependencyHasCustomDeploy(dependencyName)) {
      log.info(`${msgHead} is linked to a custom deployment of a different version (${networkFile.getDependency(dependencyName).version})`);
    } else if (networkFile.dependencySatisfiesVersionRequirement(dependencyName)) {
      const actualVersion = networkFile.getDependency(dependencyName).version;
      if (actualVersion === requiredVersion) {
        log.info(`${msgHead} is linked`);
      } else {
        log.info(`${msgHead} is linked to version ${actualVersion}`);
      }
    } else {
      log.info(`${msgHead} is linked to a different version (${networkFile.getDependency(dependencyName).version})`);
    }
  });

  _.forEach(networkFile.dependenciesNamesMissingFromPackage, (dependencyName) => {
    log.info(`- ${dependencyName} will be unlinked on next push`);
  });
}

async function proxiesInfo(networkFile: ZosNetworkFile): Promise<void> {
  log.info('Deployed proxies:');
  if (!networkFile.hasProxies()) {
    log.info('- No proxies created');
    return;
  }

  networkFile.getProxies().forEach((proxy) =>
    log.info(`- ${proxy.package}/${proxy.contract} at ${proxy.address} version ${proxy.version}`)
  );
}
