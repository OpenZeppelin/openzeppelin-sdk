import Truffle from '../models/initializer/truffle/Truffle';

export function getContractsList(message, type) {
  const contractList = Truffle.getContractNames();
  return {
    contractNames: {
      type,
      message,
      choices: contractList
    }
  };
}
