import { Logger } from 'zos-lib';
import { ContractWrapper } from 'zos-lib';

const log = new Logger('EventsFilter');
const TIMEOUT_ERROR = 'Event filter promise timed out';

export default class EventsFilter {

  public timeout: number;

  constructor(timeout?: number) {
    this.timeout = timeout || (process.env.NODE_ENV === 'test' ? 2000 : 60000);
  }

  public async call(contract: ContractWrapper, eventName: string = 'allEvents'): Promise<any> {
    log.info(`Looking for all the '${eventName}' events for contract ${contract.address}`);
    const promise = new Promise((resolve, reject) => {
      const event = contract[eventName]({}, { fromBlock: 0, toBlock: 'latest' });
      event.get((error, result) => error ? reject(error) : resolve(result));
    });
    return this._promiseTimeout(promise);
  }

  public async _promiseTimeout(promise: Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(TIMEOUT_ERROR);
      }, this.timeout);

      promise.then((res) => {
        clearTimeout(timer);
        resolve(res);
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}
