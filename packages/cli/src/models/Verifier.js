import querystring from 'querystring'
import axios from 'axios'
import cheerio from 'cheerio'
import { Logger } from 'zos-lib'

const log = new Logger('Verifier')

const Verifier = {
  async verifyAndPublish(remote, params) {
    if (remote === 'etherchain') {
      await publishToEtherchain(params)
    } else if (remote === 'etherscan') {
      await publishToEtherscan(params)
    } else {
      throw new Error('Invalid remote. Currently, ZeppelinOS contract verifier supports etherchain (mainnet only) and etherscan as remote verification applications.')
    }
  }
}

async function publishToEtherchain(params) {
  if(params.network !== 'mainnet')
    throw new Error('Invalid network. Currently, etherchain supports only mainnet')
  
  const etherchainVerificationUrl = 'https://www.etherchain.org/tools/verifyContract'
  const etherchainContractUrl = 'https://www.etherchain.org/account'
  const { compilerVersion, optimizer, contractAddress } = params
  const compiler = `soljson-v${compilerVersion.replace('.Emscripten.clang', '')}.js`
  const optimizerStatus = optimizer ? 'Enabled' : 'Disabled'

  try {
    const response = await axios.request({
      method: 'POST',
      url: etherchainVerificationUrl,
      data: querystring.stringify({ ...params, compilerVersion: compiler, optimizer: optimizerStatus }),
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    })
    if (response.status === 200) {
      const html = cheerio.load(response.data)
      const message = html('#infoModal .modal-body').text()
      if (message.match(/successful/)) {
        log.info(`Contract verified and published successfully. You can check it here: ${etherchainContractUrl}/${contractAddress}#code`)
      } else if(message.match(/^No[\w\s]*provided\.$/)) {
        throw new Error(`Error during contract verification: ${message}`)
      } else {
        throw new Error(message)
      }
    }
  } catch(error) {
    throw Error(error.message || 'Error while trying to publish contract')
  }
}

async function publishToEtherscan(params) {
  if (params.apiKey === undefined) {
    throw new Error('Etherscan API key not specified. To get one, follow this link: https://etherscancom.freshdesk.com/support/solutions/articles/35000022163-i-need-an-api-key')
  }

  const { network, compilerVersion, optimizer, contractAddress } = params
  const compiler = `v${compilerVersion.replace('.Emscripten.clang', '')}`
  const optimizerStatus = optimizer ? 1 : 0

  let apiSubdomain = ''

  if (network === 'mainnet') {
    apiSubdomain = 'api'
  } else if (network === 'rinkeby') {
    apiSubdomain = 'api-rinkeby'
  } else if (network === 'ropsten') {
    apiSubdomain = 'api-ropsten'
  } else if (network === 'kovan') {
    apiSubdomain = 'api-kovan'
  } else {
    throw new Error('Invalid network. Currently, etherscan supports mainnet, rinkeby, ropsten and kovan')
  }

  const etherscanApiUrl = `https://${apiSubdomain}.etherscan.io/api`
  const etherscanContractUrl = `https://${network}.etherscan.io/address`

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
    })
    if (response.status === 200 && response.data.status === '1') {
      log.info('Contract verification in process (this usually takes under 30 seconds)...')

      await new Promise((resolve, reject) => {
        const checkIntervalId = setInterval(async () => {
          const verificationStatus = await checkEtherscanVerification(response.data.result, etherscanApiUrl)

          if (!verificationStatus) {
            return
          }

          log.info(`Contract verified successfully. You can check it here: ${etherscanContractUrl}/${contractAddress}#code`)

          clearInterval(checkIntervalId)

          resolve()
        }, 3000)
      })
    } else {
      throw new Error(`Error while trying to verify contract: ${response.data.result}`)
    }

  } catch(error) {
    throw new Error(error.message || 'Error while trying to verify contract')
  }
}

async function checkEtherscanVerification(guid, etherscanApiUrl) {
  const queryParams = querystring.stringify({
    guid,
    action: 'checkverifystatus',
    module: 'contract',
  })

  try {
    const response = await axios.request({
      method: 'GET',
      url: `${etherscanApiUrl}?${queryParams}`,
    })

    if (response.status === 200) {
      if (response.data.status === '1') {
        return true
      } else {
        return false
      }
    } else {
      throw new Error(`Error while trying to verify contract: ${response.data.result}`)
    }
  } catch(error) {
    throw new Error(error.message || 'Error while trying to check verification status')
  } 
}

export default Verifier
