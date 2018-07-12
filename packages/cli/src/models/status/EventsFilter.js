import { Logger } from 'zos-lib'

const log = new Logger('EventsFilter')
const TIMEOUT_ERROR = 'Event filter promise timed out'

export default class EventsFilter {
  constructor(timeout) {
    this.timeout = timeout || (process.env.NODE_ENV === 'test' ? 2000 : 60000)
  }

  async call(contract, eventName = 'allEvents') {
    log.info(`Looking for all the '${eventName}' events for contract ${contract.address}`)
    const promise = new Promise((resolve, reject) => {
      const event = contract[eventName]({}, { fromBlock: 0, toBlock: 'latest' })
      event.get((error, result) => error ? reject(error) : resolve(result))
    })
    return this._promiseTimeout(promise)
  }

  async _promiseTimeout(promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(TIMEOUT_ERROR)
      }, this.timeout)

      promise.then((res) => {
        clearTimeout(timer)
        resolve(res)
      }).catch((err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  }
}
