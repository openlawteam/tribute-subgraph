import {Address} from '@graphprotocol/graph-ts';

// Reserved Internal Addresses
export let UNITS: Address = Address.fromString(
  '0x00000000000000000000000000000000000Ff1CE'
);
export let GUILD: Address = Address.fromString(
  '0x000000000000000000000000000000000000dead'
);
export let TOTAL: Address = Address.fromString(
  '0x000000000000000000000000000000000000babe'
);
export let MEMBER_COUNT: Address = Address.fromString(
  '0x00000000000000000000000000000000decafbad'
);
export let ESCROW: Address = Address.fromString(
  '0x0000000000000000000000000000000000004bec'
);

// adapter/extension names hashed (lowercase)

/**
 * Adapters
 */

/**
 * Extensions
 */

export let BANK_EXTENSION_ID: string =
  '0xea0ca03c7adbe41dc655fec28a9209dc8e6e042f3d991a67765ba285b9cf73a0';

export let ERC20_EXTENSION_ID: string =
  '0x77d63af07d7aad7f422b79cf9d7285aec3f3e6f32e6e4391f1ce842d752663fd';
