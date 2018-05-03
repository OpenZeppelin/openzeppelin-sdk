import KernelWrapper from "./KernelWrapper";
import ContractsProvider from '../utils/ContractsProvider'

export default {
  async fromKernelNetworkFile(network, txParams = {}) {
    const kernelAddress = this._readKernelAddressFromNetworkFile(network)
    return this.fromAddress(kernelAddress, txParams)
  },

  async fromAddress(address, txParams = {}) {
    this._fetchKernel(address)
    await this._fetchZepToken()
    await this._fetchVouching()
    return new KernelWrapper(this.kernel, this.zepToken, this.vouching, txParams)
  },

  _fetchKernel(address) {
    const Kernel = ContractsProvider.kernel()
    this.kernel = new Kernel(address)
  },

  async _fetchZepToken() {
    const ZepToken = ContractsProvider.zepToken()
    const zepTokenAddress = await this.kernel.token()
    this.zepToken = new ZepToken(zepTokenAddress)
  },

  async _fetchVouching() {
    const Vouching = ContractsProvider.vouching()
    const vouchingAddress = await this.kernel.vouches()
    this.vouching = new Vouching(vouchingAddress)
  },

  _readKernelAddressFromNetworkFile(network) {
    const file = `node_modules/kernel/package.zos.${network}.json`;
    const json = fs.readFileSync(file);
    const data = JSON.parse(json)
    const proxies = data.proxies.Kernel
    if(proxies.length === 0) return 0
    const lastProxy = proxies[proxies.length - 1]
    return lastProxy.address
  }
}
