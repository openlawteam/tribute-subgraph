import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import {
  BankExtension,
  NewBalance,
  Withdraw,
} from "./generated/BankExtension/BankExtension";
import { DaoRegistry } from "./generated/BankExtension/DaoRegistry";
import { ERC20Extension } from "./generated/BankExtension/ERC20Extension";

import { Bank, TributeDao, Token, TokenHolder } from "./generated/schema";

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

let BANK_EXTENSION_ID: string =
  "0xea0ca03c7adbe41dc655fec28a9209dc8e6e042f3d991a67765ba285b9cf73a0";

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
    // check if the DAO has an ERC20 extension and assign members balance
    internalERC20Balance(daoAddress, memberAddress);

    // let member = Member.load(memberAddress.toHex());

    // if (member == null) {
    //   member = new Member(memberAddress.toHex());
    //   member.createdAt = createdAt;
    //   member.memberAddress = memberAddress;
    //   member.delegateKey = memberAddress;
    //   member.isDelegated = false;
    // }

    let tokenHolder = TokenHolder.load(memberAddress.toHex());

    if (tokenHolder == null) {
      tokenHolder = new TokenHolder(memberAddress.toHex());
      tokenHolder.createdAt = createdAt;
      tokenHolder.memberAddress = memberAddress;
    }

    /**
     * get `balanceOf` for members UNITS
     */

    // get balanceOf member units
    let balanceOfUNITS = bankRegistry.balanceOf(memberAddress, UNITS);
    tokenHolder.totalUnits = balanceOfUNITS;

    // omit the `TOTAL` & `GUILD` addresses from the ragequit check
    // if (
    //   TOTAL.toHex() != memberAddress.toHex() &&
    //   GUILD.toHex() != memberAddress.toHex()
    // ) {
    //   let didFullyRagequit = balanceOfUNITS.equals(BigInt.fromI32(0));

    //   // fully raged quit
    //   member.didFullyRagequit = didFullyRagequit;
    // }

    tokenHolder.save();
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

  if (bank != null) {
    bank.totalUnits = balanceOfTotalUnits.toString();
    bank.totalUnitsIssued = balanceOfTotalUnitsIssued.toString();

    bank.save();
  }
}

function internalERC20Balance(
  daoAddress: Address,
  memberAddress: Address
): void {
  // check and get ERC20 extension address
  // let erc20ExtensionId = daoAddress
  //   .toHex()
  //   .concat("-extension-")
  //   .concat(ERC20_EXTENSION_ID);
  // let erc20Extension = Extension.load(erc20ExtensionId);

  /**
   * @todo
   * get extension contract address using the extension id
   */

  let daoRegistryContract = DaoRegistry.bind(daoAddress);
  let erc20ExtensionAddress = daoRegistryContract.getExtensionAddress(
    Bytes.fromHexString(ERC20_EXTENSION_ID) as Bytes
  );

  if (erc20ExtensionAddress != null) {
    let erc20ExtensionRegistry = ERC20Extension.bind(
      erc20ExtensionAddress
      // Address.fromString(erc20Extension.extensionAddress.toHexString())
    );

    // erc20 token details
    let name = erc20ExtensionRegistry.name();
    let symbol = erc20ExtensionRegistry.symbol();
    let totalSupply = erc20ExtensionRegistry.totalSupply();

    let balance = erc20ExtensionRegistry.balanceOf(memberAddress);

    let tokenId = daoAddress
      .toHex()
      .concat("-token-")
      .concat(erc20ExtensionAddress.toHexString());
    // .concat(erc20Extension.extensionAddress.toHex());

    let token = Token.load(tokenId);

    if (token == null) {
      token = new Token(tokenId);

      token.symbol = symbol;
      token.name = name;
      token.tokenAddress = erc20ExtensionAddress; //erc20Extension.extensionAddress;
    }

    token.totalSupply = totalSupply;

    token.save();

    // update holder
    let tokenHolderId = daoAddress
      .toHex()
      .concat("-tokenholder-")
      .concat(memberAddress.toHex());

    let tokenHolder = TokenHolder.load(tokenHolderId);

    if (tokenHolder == null) {
      tokenHolder = new TokenHolder(tokenHolderId);

      // tokenHolder.member = memberAddress.toHex();
      tokenHolder.token = tokenId;
    }

    tokenHolder.balance = balance;

    tokenHolder.save();
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

// event Withdraw(address member, address tokenAddr, uint256 amount);
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
