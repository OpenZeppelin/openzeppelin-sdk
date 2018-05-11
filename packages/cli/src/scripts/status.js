import AppController from '../models/AppController';
import { Logger } from 'zos-lib';
import _ from 'lodash';

let log = new Logger('scripts/status');

export default async function status({ network, txParams = {}, packageFileName = undefined, networkFileName = undefined, logger = undefined }) {
  if (logger) log = logger;
  const appController = new AppController(packageFileName).onNetwork(network, txParams, networkFileName);
  log.info(`Application status for network ${network}`);

  if (!(await appInfo(appController))) return;
  if (!(await versionInfo(appController))) return;
  await stdlibInfo(appController);
  await contractsInfo(appController);
  await proxiesInfo(appController);
}

async function appInfo(appController) {
  if (!appController.appAddress) {
    log.info(`Application is not yet deployed`);
    return false;
  }

  await appController.loadApp();
  log.info(`Application is deployed at ${appController.appAddress}`);
  log.info(`- Proxy factory is at ${appController.appManagerWrapper.factory.address}`);
  log.info(`- Package is at ${appController.appManagerWrapper.package.address}`);
  return true;
}

async function versionInfo(appController) {
  const requestedVersion = appController.package.version;
  const currentVersion = appController.appManagerWrapper.version;
  if (requestedVersion !== currentVersion) {
    log.info(`- Deployed version ${currentVersion} is out of date (latest is ${requestedVersion})`)
    return false;
  } else {
    log.info(`- Deployed version ${currentVersion} matches the latest one defined`)
    return true;
  }
}

async function contractsInfo(appController) {
  log.info('Application contracts:');
  if (_.isEmpty(appController.package.contracts)) {
    log.info(`- No contracts registered`);
    return;
  }

  _.each(appController.package.contracts, function (contractName, contractAlias) {
    const isDeployed = appController.isContractDeployed(contractAlias);
    const hasChanged = appController.hasContractChanged(contractAlias);
    const fullName = contractName == contractAlias ? contractAlias : `${contractAlias} (implemented by ${contractName})`;
    if (!isDeployed) {
      log.info(`- ${fullName} is not deployed`);
    } else if (hasChanged) {
      log.info(`- ${fullName} is out of date with respect to the local version`);
    } else {
      log.info(`- ${fullName} is deployed and up to date`);
    }
  });
}

async function stdlibInfo(appController) {
  log.info('Standard library:');

  // REFACTOR: Part of this logic is duplicated from NetworkAppController#setStdilb, consider deduplicating it
  const requiredStdlib = appController.package.stdlib;
  const requiresStdlib = !_.isEmpty(appController.package.stdlib);
  const networkStdlib = appController.networkPackage.stdlib;
  const hasNetworkStdlib = !_.isEmpty(networkStdlib);
  const networkStdlibMatches = hasNetworkStdlib && networkStdlib.name === requiredStdlib.name && networkStdlib.version === requiredStdlib.version;
  const hasCustomDeploy = hasNetworkStdlib && networkStdlib.customDeploy;
  const customDeployMatches = hasCustomDeploy && networkStdlibMatches;

  if (!requiresStdlib) {
    const deployedWarn = hasNetworkStdlib ? `(though ${networkStdlib.name}@${networkStdlib.version} is currently deployed)` : '';
    log.info(`- No stdlib specified for current version ${deployedWarn}`);
    return;
  }
  
  log.info(`- Stdlib ${requiredStdlib.name}@${requiredStdlib.version} required by current version`);

  if (!hasNetworkStdlib) {
    log.info(`- No stdlib is deployed`);
  } else if (customDeployMatches) {
    log.info(`- Custom deploy of stdlib set at ${networkStdlib.address}`);
  } else if (hasCustomDeploy) {
    log.info(`- Custom deploy of different stdlib ${networkStdlib.name}@${networkStdlib.version} at ${networkStdlib.address}`);
  } else if (networkStdlibMatches) {
    log.info(`- Deployed application is correctly connected to stdlib`);
  } else {
    log.info(`- Deployed application is connected to different stdlib ${networkStdlib.name}@${networkStdlib.version}`);
  }
}

async function proxiesInfo(appController) {
  log.info("Deployed proxies:");
  const proxies = appController.networkPackage.proxies;
  if (_.isEmpty(proxies)) {
    log.info('- No proxies created');
    return;
  }

  _.each(proxies, (proxyInfos, alias) => {
    _.each(proxyInfos, ({ address, version }) => {
      log.info(`- ${alias} at ${address} version ${version}`);
    });
  });
}