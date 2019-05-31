import ZWeb3 from '../artifacts/ZWeb3';

export default function advanceBlock(): Promise<any> {
  return new Promise((resolve, reject) => {
    ZWeb3.provider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: Date.now(),
      },
      (err, res) => {
        return err ? reject(err) : resolve(res);
      },
    );
  });
}
