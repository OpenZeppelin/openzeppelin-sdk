import { FileSystem as fs } from 'zos-lib'

export default function exportKernelData(outputFile, jurisdiction, zepToken, validator, vouching) {
  fs.writeJson(outputFile, {
    jurisdiction: jurisdiction.address,
    zepToken: zepToken.address,
    validator: validator.address,
    vouching: vouching.address
  })
}
