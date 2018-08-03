import querystring from 'querystring'
import axios from 'axios'
import cheerio from 'cheerio'
import { Logger } from 'zos-lib'

const log = new Logger('Verifier')

const Verifier = {
  async verifyAndPublish(remote, params) {
    if (remote === 'etherchain') {
      await publishToEtherchain(params)
    } else {
      throw new Error('Invalid remote. Currently, zOS contract verifier only supports etherchain as remote verification application.')
    }
  }
}

async function publishToEtherchain(params) {
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

export default Verifier
