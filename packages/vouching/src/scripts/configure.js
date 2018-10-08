import colors from 'colors';
import * as constants from './constants';

// zOS utils.
import { Contracts } from 'zos-lib';

export default async function configure(options) {
  console.log(colors.cyan(`configuring vouching application`).inverse);

  const owner = options.txParams.from;

  // Retrieve network data.
  const networkData = require(`../../zos.${options.network}.json`);

  // Retrieve proxies.
  const jurisdiction = getJurisdictionProxy(networkData);
  const validator = getValidatorProxy(networkData);

  // Add ZEPValidator to the jurisdiction.
  console.log(`Adding ZEPValidator ${validator.address} to the jurisdiction...`);
  await jurisdiction.addValidator(validator.address, "ZEP Validator");

  // Add ZEPToken's attributes to the jurisdiction.
  console.log(`Adding ZEPToken attributes to the jurisdiction: ${constants.ZEPTOKEN_ATTRIBUTE_ID}`);
  await jurisdiction.addAttributeType(
    constants.ZEPTOKEN_ATTRIBUTE_ID, // id
    false, // restrictedAccess
    false, // onlyPersonal
    0, // secondarySource
    0, // secondaryId
    0, // minimumStake
    0, // jurisdictionFee
    "can transfer" // description
  );

  // Have the validator approve the attributes.
  console.log(`Approving attribute...`);
  jurisdiction.addValidatorApproval(validator.address, constants.ZEPTOKEN_ATTRIBUTE_ID);

  // Add an organization to the validator.
  const maxAddresses = 100000;
  const orgName = 'ZEP Org';
  console.log(`Adding organization to the validator: address ${owner}, addresses: ${maxAddresses}, name: ${orgName}`);
  await validator.addOrganization(
    owner, // org. address
    maxAddresses,
    orgName
  );

  console.log(colors.cyan(`vouching application configured`).inverse);
}

function getJurisdictionProxy(networkData) {

  // Find BasicJurisdiction instance.
  const proxies = networkData.proxies['tpl-contracts-zos/BasicJurisdiction'];
  if(proxies.length === 0) throw new Error('Instance for BasicJurisdiction not found');
  console.log(`BasicJurisdiction proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];
  
  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  console.log(`BasicJurisdiction instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const BasicJurisdiction = Contracts.getFromLocal('BasicJurisdiction');

  return BasicJurisdiction.at(proxyAddress);
}

function getValidatorProxy(networkData) {

  // Find ZEPValidator instance.
  const proxies = networkData.proxies['zos-vouching/ZEPValidator'];
  if(proxies.length === 0) throw new Error('Instance for ZEPValidator not found');
  console.log(`ZEPValidator proxies found: ${proxies.length}`);
  const lastProxy = proxies[proxies.length - 1];
  
  // Proxy is valid.
  const proxyAddress = lastProxy.address;
  console.log(`ZEPValidator instance address: ${proxyAddress}`);

  // Retrieve contract object.
  const ZEPValidator = Contracts.getFromLocal('ZEPValidator');

  return ZEPValidator .at(proxyAddress);
}
