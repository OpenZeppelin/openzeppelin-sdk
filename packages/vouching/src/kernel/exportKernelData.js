import { FileSystem as fs } from 'zos-lib'

export default function exportKernelData(outputFile, app, jurisdiction, zepToken, validator, vouching) {
  fs.writeJson(outputFile, {
    app: app.address,
    zepToken: zepToken.address,
    vouching: vouching.address,
    validator: validator.address,
    jurisdiction: jurisdiction.address,
  })
}
