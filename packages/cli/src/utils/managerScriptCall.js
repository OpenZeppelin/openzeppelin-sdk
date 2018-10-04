import promptPassword from './promptPassword'
import Truffle from '../models/truffle/Truffle';

const ACCOUNT_LOCKED_ERROR = {
  TRUFFLE : 'Error: signer account is locked',
  GETH: 'authentication needed: password or unlock',
  PARITY: 'Your account is locked. Unlock the account via CLI, personal_unlockAccount or use Trusted Signer'
}

export default async function manageScriptCall(call, txParams) {
  try {
    await call()
  } catch (e) {
    if(Object.values(ACCOUNT_LOCKED_ERROR).includes(e.message)){
      const config = Truffle.config()
      const from = txParams.from ? txParams.from : config.from ? config.from : web3.eth.accounts[0]
      await promptPassword(from, 0)
      await call()
    } else {
      throw(e)
    }
  }
}

