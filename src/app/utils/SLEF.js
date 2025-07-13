import {
  CORE_INTERNAL_NAME_MAPPING,
  CORIOLIS_TO_FD_BULKHEAD_NAME_MAPPING,
  HARDPOINT_NUM_TO_CLASS,
  SHIP_FD_NAME_TO_CORIOLIS_NAME,
} from "./CompanionApiUtils.js";

/**
 * Converts the internal Coriolis representation to SLEF
 * @param {typeof import('../shipyard/Ship.js')} ship Ship class
 * @param {Object} internalData Internal JSON data
 */
export function toSLEF(ship, internalData) {
  console.log({ ship });
  const dataReference = internalData.references[0];
  const fdShipName = Object.entries(SHIP_FD_NAME_TO_CORIOLIS_NAME).find(
    ([_, coriolisName]) => coriolisName === ship.id,
  )[0];

  const slef = [
    {
      header: {
        appName: dataReference.name ?? "Coriolis.io",
        appVersion: "1.0",
        appURL: dataReference.url ?? "",
        appCustomProperties: {
          ...dataReference,
          shipName: internalData.name,
        },
      },
      data: {
        Ship: fdShipName,
        HullValue: ship.m.discountedCost,
        ModulesValue: ship.totalCost - ship.m.discountedCost,
        UnladenMass: ship.unladenMass,
        CargoCapacity: ship.cargoCapacity,
        FuelCapacity: {
          Main: ship.fuelCapacity,
          Reserve: ship.reserveFuelCapacity,
        },
        Modules: [
          {
            Slot: CORE_INTERNAL_NAME_MAPPING.coriolisToFD.cargoHatch,
            On: true,
            Item: CORE_INTERNAL_NAME_MAPPING.fdToItemName.CargoHatch,
            Priority: 0,
            Value: 0,
          },
          {
            Slot: CORE_INTERNAL_NAME_MAPPING.coriolisToFD.bulkheads,
            On: true,
            Item: `${fdShipName}_${CORIOLIS_TO_FD_BULKHEAD_NAME_MAPPING[ship.bulkheads.m.name]}`,
            Priority: 0,
            Value: ship.bulkheads.discountedCost,
            Engineering: engineeringFromBlueprint(ship.bulkheads.m.blueprint),
          },
          ...ship.standard.map(coreInternalToSLEF),
          ...ship.hardpoints.reduce(hardpointsToSLEF, []),
          ...ship.internal.reduce(optionalInternalToSLEF, []),
        ],
      },
    },
  ];
  return slef;
}

/**
 * Converts an internal representation of one hardpoint to SLEF
 *
 * Be aware that utility mounts are also considered to be Tiny Hardpoints
 * @param {Object} hardpoint Single hardpoint from the ship class (ship.hardpoints)
 */
function hardpointsToSLEF(acc, hardpoint) {
  if (!hardpoint.m) return acc;

  const Slot = `${HARDPOINT_NUM_TO_CLASS[hardpoint.maxClass]}Hardpoint${hardpoint.slotIndex}`;
  acc.push({
    Slot,
    On: Boolean(hardpoint.enabled),
    Item: hardpoint.m.symbol,
    Priority: hardpoint.priority,
    Value: hardpoint.discountedCost,
    Engineering: engineeringFromBlueprint(hardpoint.m.blueprint),
  });
  return acc;
}

/**
 * Converts an internal representation of one core internal to SLEF
 * @param {Object} coreInternal Core internals from ship.standard
 */
function coreInternalToSLEF(coreInternal) {
  let slot =
    CORE_INTERNAL_NAME_MAPPING.coriolisToFD[coreInternal.m.ukName] ??
    coreInternal.m.ukName.replace(" ", "");

  return {
    Slot: slot,
    On: Boolean(coreInternal.enabled),
    Item: coreInternal.m.symbol,
    Priority: coreInternal.priority,
    Value: coreInternal.discountedCost,
    Engineering: engineeringFromBlueprint(coreInternal.m.blueprint),
  };
}

/**
 * Converts an internal representation of one optional internal to SLEF
 * @param {Object} optionalInternal Optional internal component from the ship class (ship.internal)
 */
function optionalInternalToSLEF(acc, optionalInternal) {
  if (!optionalInternal.m) return acc;

  acc.push({
    Slot: `Slot${optionalInternal.slotIndex.toString().padStart(2, 0)}_Size${optionalInternal.maxClass}`,
    Item: optionalInternal.m.symbol,
    On: Boolean(optionalInternal.enabled),
    Priority: optionalInternal.priority,
    Value: optionalInternal.discountedCost,
    Engineering: engineeringFromBlueprint(optionalInternal.m.blueprint),
  });
  return acc;
}

/**
 * Creates an engineering object from a blueprint object
 */
function engineeringFromBlueprint(blueprint) {
  if (!blueprint) return {};
  return {
    BlueprintName: blueprint.fdname,
    Level: blueprint.grade,
    Quality: 1,
    ...(blueprint?.special?.edname
      ? { ExperimentalEffect: blueprint.special.edname }
      : {}),
  };
}
