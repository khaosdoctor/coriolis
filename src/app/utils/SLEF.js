import { findHardpoint, findStandard } from "../shipyard/ModuleUtils"

export function toSLEF (internalData) {
  console.log(`toSLEF`, {internalData})

  console.log(findHardpoint(undefined, 1, undefined, undefined , "F"))
  return [{
    header: {
      appName: internalData.references[0].name ?? "Coriolis.io",
      appVersion: "1.0",
      appURL: internalData.references[0].url ?? "",
      appCustomProperties: {
        ...internalData.references[0],
        shipName: internalData.name
      }
    },
    data: {
      Ship: internalData.references[0].shipId,
      Modules: []
    }
  }]
}
