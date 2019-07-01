import Web3 from 'web3';
const web3 = new Web3();

export const signer = '0x239938d1Bd73e99a5042d29DcFFf6991e0Fe5626';
export const signerPk = '0xbe7e12ce20410c5f0207bd6c7bcae39052679bfd401c62849657ebfe23e3711b';

export function signDeploy(
  factory: string,
  salt: string,
  logic: string,
  admin: string,
  initData: string = '',
  pk: string = signerPk,
): string {
  // Encodes and tightly packs the arguments and calculates keccak256
  const hash = web3.utils.soliditySha3(
    { type: 'uint256', value: salt },
    { type: 'address', value: logic },
    { type: 'address', value: admin },
    { type: 'bytes', value: initData },
    { type: 'address', value: factory },
  );
  // Prepends the Ethereum Signed Message string, hashes, and signs
  const signed = web3.eth.accounts.sign(hash, pk);
  return signed.signature;
}
