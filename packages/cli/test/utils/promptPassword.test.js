import sinon from 'sinon'
import promptPassword from '../../src/utils/promptPassword'

let spy
let account

describe('Functionality for unlocking a locked account', () => {
  before(() => {
    spy = sinon.spy(web3.personal, 'unlockAccount')
    account = web3.eth.accounts[0]
  })
  
  beforeEach(() => {
    process.env.ZOS_ETH_PASSWORD = undefined
  })

  it('uses pwd from env variable ZOS_ETH_PASSWORD if found', async () => {
    process.env.ZOS_ETH_PASSWORD = 'password'
    await promptPassword(account)
    expect(spy.calledWith(account, process.env.ZOS_ETH_PASSWORD))
  })
})