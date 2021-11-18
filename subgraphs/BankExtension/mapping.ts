import { Address, Bytes, log } from "@graphprotocol/graph-ts";

import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "./generated/BankExtension/BankExtension";
import { DaoRegistry } from "./generated/BankExtension/DaoRegistry";
import { ERC20Extension } from "./generated/BankExtension/ERC20Extension";

import {
  Bank,
  Member,
  Token,
  TokenHolder,
  TributeDao,
} from "./generated/schema";

// Reserved Internal Addresses
let ESCROW: Address = Address.fromString(
  "0x0000000000000000000000000000000000004bec"
);
let GUILD: Address = Address.fromString(
  "0x000000000000000000000000000000000000dead"
);
let MEMBER_COUNT: Address = Address.fromString(
  "0x00000000000000000000000000000000decafbad"
);
let TOTAL: Address = Address.fromString(
  "0x000000000000000000000000000000000000babe"
);
let UNITS: Address = Address.fromString(
  "0x00000000000000000000000000000000000Ff1CE"
);

/**
 * Extensions
 */

let ERC20_EXTENSION_ID: string =
  "0x77d63af07d7aad7f422b79cf9d7285aec3f3e6f32e6e4391f1ce842d752663fd";

function internalTransfer(
  createdAt: string,
  extensionAddress: Address,
  memberAddress: Address,
  tokenAddress: Address
): void {
  // get bank extension bindings
  let bankRegistry = BankExtension.bind(extensionAddress);
  // get dao address
  let daoAddress = bankRegistry.dao();

  if (
    TOTAL.toHex() != memberAddress.toHex() &&
    GUILD.toHex() != memberAddress.toHex() &&
    MEMBER_COUNT.toHex() != memberAddress.toHex() &&
    ESCROW.toHex() != memberAddress.toHex() &&
    TOTAL.toHex() != tokenAddress.toHex() &&
    GUILD.toHex() != tokenAddress.toHex() &&
    MEMBER_COUNT.toHex() != tokenAddress.toHex() &&
    ESCROW.toHex() != tokenAddress.toHex()
  ) {
    // create tribute dao entity
    let tributeDao = TributeDao.load(daoAddress.toHex());

    if (tributeDao == null) {
      tributeDao = new TributeDao(daoAddress.toHex());

      tributeDao.createdAt = createdAt;
      tributeDao.daoAddress = daoAddress;

      tributeDao.save();
    }

    // check if the DAO has an ERC20 extension and assign members balance
    internalERC20Balance(daoAddress, memberAddress);

    // create or update the member entity for the new balance
    let memberId = daoAddress
      .toHex()
      .concat("-member-")
      .concat(memberAddress.toHex());
    let member = Member.load(memberId);

    if (member == null) {
      member = new Member(memberId);

      member.createdAt = createdAt;
      member.memberAddress = memberAddress;
    }

    member.units = bankRegistry.balanceOf(memberAddress, UNITS);

    member.save();
  }

  // get total units minted for the DAO
  let balanceOfTotalUnits = bankRegistry.balanceOf(TOTAL, UNITS);
  // get balance of units owned by the guild bank
  let balanceOfGuildUnits = bankRegistry.balanceOf(GUILD, UNITS);
  // get total units issued and outstanding in the DAO (not owned by guild bank)
  let balanceOfTotalUnitsIssued = balanceOfTotalUnits.minus(
    balanceOfGuildUnits
  );

  let bank = Bank.load(daoAddress.toHexString());

  if (bank == null) {
    bank = new Bank(daoAddress.toHexString());
    bank.bankAddress = extensionAddress;
  }

  // update the accounting for dao bank
  bank.totalUnits = balanceOfTotalUnits.toString();
  bank.totalUnitsIssued = balanceOfTotalUnitsIssued.toString();

  bank.save();
}

function internalERC20Balance(
  daoAddress: Address,
  memberAddress: Address
): void {
  let daoRegistryContract = DaoRegistry.bind(daoAddress);
  // get ERC20 extension address
  let erc20ExtensionAddress = daoRegistryContract.try_getExtensionAddress(
    Bytes.fromHexString(ERC20_EXTENSION_ID) as Bytes
  );

  if (erc20ExtensionAddress.reverted) {
    log.info("try_getExtensionAddress reverted", []);
  } else {
    let erc20ExtensionRegistry = ERC20Extension.bind(
      erc20ExtensionAddress.value
    );

    // erc20 token details
    let balance = erc20ExtensionRegistry.balanceOf(memberAddress);
    let name = erc20ExtensionRegistry.name();
    let symbol = erc20ExtensionRegistry.symbol();
    let totalSupply = erc20ExtensionRegistry.totalSupply();

    let tokenHolderId = daoAddress
      .toHex()
      .concat("-tokenholder-")
      .concat(erc20ExtensionAddress.value.toHexString())
      .concat("-")
      .concat(memberAddress.toHex());

    let tokenHolder = TokenHolder.load(tokenHolderId);

    if (tokenHolder == null) {
      tokenHolder = new TokenHolder(tokenHolderId);

      tokenHolder.name = name;
      tokenHolder.symbol = symbol;
      tokenHolder.tokenAddress = erc20ExtensionAddress.value;
      tokenHolder.memberAddress = memberAddress;
    }

    tokenHolder.balance = balance;
    tokenHolder.save();

    let tokenId = daoAddress
      .toHex()
      .concat("-token-")
      .concat(erc20ExtensionAddress.value.toHexString());

    let token = Token.load(tokenId);

    if (token == null) {
      token = new Token(tokenId);

      token.name = name;
      token.symbol = symbol;
      token.tokenAddress = erc20ExtensionAddress.value;
    }

    token.totalSupply = totalSupply;
    token.save();
  }
}

export function handleNewBalance(event: NewBalance): void {
  log.info(
    "================ NewBalance event fired. member {}, tokenAddr {}, amount {}",
    [
      event.params.member.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
    ]
  );

  internalTransfer(
    event.block.timestamp.toString(),
    event.address,
    event.params.member,
    event.params.tokenAddr
  );
}

export function handleWithdraw(event: Withdraw): void {
  log.info(
    "================ Withdraw event fired. account {}, tokenAddr {}, amount {}",
    [
      event.params.account.toHexString(),
      event.params.tokenAddr.toHexString(),
      event.params.amount.toString(),
    ]
  );

  internalTransfer(
    "",
    event.address,
    event.params.account,
    event.params.tokenAddr
  );
}
