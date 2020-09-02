import ZWeb3 from '../artifacts/ZWeb3';

export default function advanceBlock(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof ZWeb3.provider == 'string') {
      return reject('provider not set');
    }

    ZWeb3.provider.send(
      {
        jsonrpc: '2.0',
        method: 'evm_mine',
        params: [],
        id: Date.now(),
      },
      (err, res) => {
        return err ? reject(err) : resolve(res);
      },
    );
  });
}
