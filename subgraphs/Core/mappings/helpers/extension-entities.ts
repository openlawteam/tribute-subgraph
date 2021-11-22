import {Address, Bytes, log} from '@graphprotocol/graph-ts';

import {BankExtension as BankExtensionTemplate} from '../../generated/templates';
import {Bank} from '../../generated/schema';

import {internalERC20Balance} from '../bank-extension-mapping';
import {BANK_EXTENSION_ID, ERC20_EXTENSION_ID} from '../dao-constants';

export function loadOrCreateExtensionEntity(
  daoAddress: Address,
  extensionId: Bytes,
  extensionAddress: Address,
  transactionFrom: Address
): void {
  if (BANK_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info('INFO BANK_EXTENSION_ID, extensionId: {}', [
      extensionId.toHexString(),
    ]);

    BankExtensionTemplate.create(extensionAddress);

    bank(daoAddress, extensionAddress);
  } else if (ERC20_EXTENSION_ID.toString() == extensionId.toHexString()) {
    log.info('INFO ERC20_EXTENSION_ID, extensionId: {}', [
      extensionId.toHexString(),
    ]);

    erc20(daoAddress, transactionFrom);
  }
}

// if `BankExtension` assign to its DAO
function bank(daoAddress: Address, extensionAddress: Address): void {
  let bankId = daoAddress
    .toHex()
    .concat('-bank-')
    .concat(extensionAddress.toHex());
  let bank = Bank.load(bankId);

  if (bank == null) {
    bank = new Bank(bankId);
  }

  bank.tributeDao = daoAddress.toHex();
  bank.bankAddress = extensionAddress;

  bank.save();
}

// if `ERC20Extension` assign to its DAO; add creator with balance
function erc20(daoAddress: Address, transactionFrom: Address): void {
  // add creator to TokenHolder entity with initial balance
  internalERC20Balance(daoAddress, transactionFrom);
}
