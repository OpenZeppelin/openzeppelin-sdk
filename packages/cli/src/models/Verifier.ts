import axios from 'axios';
import cheerio from 'cheerio';
import querystring from 'querystring';

import { sleep, Logger } from 'zos-lib';

const log: Logger = new Logger('Verifier');

// Max number of API request retries on error
const RETRY_COUNT: number = 3;

// Time to sleep between retries for API requests
const RETRY_SLEEP_TIME: number = 5000;

interface VerifierOptions {
  contractName: string;
  compilerVersion: string;
  optimizer: boolean;
  optimizerRuns: string;
  contractSource: string;
  contractAddress: string;
  network: string;
  apiKey?: string;
}

const Verifier = {
  async verifyAndPublish(remote: string, params: VerifierOptions): Promise<void | never> {
    if (remote === 'etherchain') {
      await publishToEtherchain(params);
    } else if (remote === 'etherscan') {
      await publishToEtherscan(params);
    } else {
      throw new Error('Invalid remote. Currently, ZeppelinOS contract verifier supports etherchain and etherscan as remote verification applications.');
    }
  }
};

async function publishToEtherchain(params: VerifierOptions): Promise<void | never> {
  if(params.network !== 'mainnet') {
    throw new Error('Invalid network. Currently, etherchain supports only mainnet');
  }

  const etherchainVerificationUrl = 'https://www.etherchain.org/tools/verifyContract';
  const etherchainContractUrl = 'https://www.etherchain.org/account';
  const { compilerVersion, optimizer, contractAddress } = params;
  const compiler = `soljson-v${compilerVersion.replace('.Emscripten.clang', '')}.js`;
  const optimizerStatus = optimizer ? 'Enabled' : 'Disabled';

  try {
    const response = await axios.request({
      method: 'POST',
      url: etherchainVerificationUrl,
      data: querystring.stringify({ ...params, compilerVersion: compiler, optimizer: optimizerStatus }),
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    });
    if (response.status === 200) {
      const html = cheerio.load(response.data);
      const message = html('#infoModal .modal-body').text();
      if (message.match(/successful/)) {
        log.info(`Contract verified and published successfully. You can check it here: ${etherchainContractUrl}/${contractAddress}#code`);
      } else if(message.match(/^No[\w\s]*provided\.$/)) {
        throw new Error(`Error during contract verification: ${message}`);
      } else {
        throw new Error(message);
      }
    }
  } catch(error) {
    throw Error(error.message || 'Error while trying to publish contract');
  }
}

async function publishToEtherscan(params: VerifierOptions): Promise<void | never> {
  const { network, compilerVersion, optimizer, contractAddress } = params;
  const compiler = `v${compilerVersion.replace('.Emscripten.clang', '')}`;
  const optimizerStatus = optimizer ? 1 : 0;

  const apiSubdomain = setEtherscanApiSubdomain(network);
  const etherscanApiUrl = `https://${apiSubdomain}.etherscan.io/api`;
  const networkSubdomain = network === 'mainnet' ? '' : `${network}.`;
  const etherscanContractUrl = `https://${networkSubdomain}etherscan.io/address`;

  try {
    const response = await axios.request({
      method: 'POST',
      url: etherscanApiUrl,
      data: querystring.stringify({
        apikey: params.apiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: params.contractSource,
        contractname: params.contractName,
        compilerversion: compiler,
        optimizationUsed: optimizerStatus,
        runs: params.optimizerRuns,
      }),
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.status === 200 && response.data.status === '1') {
      log.info('Contract verification in process (this usually takes under 30 seconds)...');
      await checkEtherscanVerificationStatus(response.data.result, etherscanApiUrl, RETRY_COUNT);
      log.info(`Contract verified successfully. You can check it here: ${etherscanContractUrl}/${contractAddress}#code`);
    } else {
      throw new Error(`Error while trying to verify contract: ${response.data.result}`);
    }

  } catch(error) {
    throw new Error(error.message || 'Error while trying to verify contract');
  }
}

async function checkEtherscanVerificationStatus(guid: string, etherscanApiUrl: string, retries: number = RETRY_COUNT): Promise<void | never> {
  const queryParams = querystring.stringify({
    guid,
    action: 'checkverifystatus',
    module: 'contract',
  });

  try {
    const response = await axios.request({
      method: 'GET',
      url: `${etherscanApiUrl}?${queryParams}`,
    });

    if (response.data.status !== '1') {
      throw new Error(`Error while trying to verify contract: ${response.data.result}`);
    }
  } catch(error) {
    if (retries === 0) throw new Error(error.message || 'Error while trying to check verification status');
    await sleep(RETRY_SLEEP_TIME);
    await checkEtherscanVerificationStatus(guid, etherscanApiUrl, retries - 1);
  }
}

function setEtherscanApiSubdomain(network: string): string | never {
  switch(network) {
    case 'mainnet':
      return 'api';
    case 'rinkeby':
      return 'api-rinkeby';
    case 'ropsten':
      return 'api-ropsten';
    case 'kovan':
      return 'api-kovan';
    default:
      throw new Error('Invalid network. Currently, etherscan supports mainnet, rinkeby, ropsten and kovan');
  }
}

export default Verifier;
