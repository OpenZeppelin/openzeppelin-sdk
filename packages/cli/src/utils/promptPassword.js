import { promisify } from 'util'
import stdout from '../utils/stdout';

const MAX_TRIES = 3

async function promptPassword(account, n) {
  if(n < MAX_TRIES) {
    let pwd
    if (process.env.ZOS_ETH_PASSWORD) {
      return unlockAccount(account, process.env.ZOS_ETH_PASSWORD)
    } else {
      pwd = await new Promise((resolve) => {
        const prompt = require('readline').createInterface({ input: process.stdin, output: process.stdout })
        prompt.question(`Account ${account} is locked. Enter password: `, (password) => {
          prompt.close()
          resolve(password)
        })
        prompt._writeToOutput = () => {}
      })
      try {
        unlockAccount(account, pwd)
        process.env.ZOS_ETH_PASSWORD = pwd
      } catch (e) {
        return tryUnlockAccount(account, n+1)
      }
    }
  }
}

function unlockAccount(address, password) {
  process.stdout.write('\n')
  return promisify(web3.personal.unlockAccount.bind(web3.eth))(address, password)
}

export default promptPassword