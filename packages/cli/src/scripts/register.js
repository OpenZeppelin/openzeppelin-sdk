import KernelProvider from "../zos-lib/kernel/KernelProvider";

export default async function register({ releaseAddress, network, txParams = {} }) {
  if(!releaseAddress) throw 'You must provide a release address'
  const kernel = await KernelProvider.fromKernelNetworkFile(network, txParams)
  await kernel.validateCanRegister(releaseAddress)

  try {
    await kernel.register(releaseAddress)
  } catch (error) {
    console.error('There was an error trying to register your release.', error)
  }
}
