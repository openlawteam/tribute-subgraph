import { Address, Bytes, log, store } from "@graphprotocol/graph-ts";

import {
  ProcessedProposal,
  SponsoredProposal,
  SubmittedProposal,
  UpdateDelegateKey,
  AdapterAdded,
  AdapterRemoved,
  ExtensionAdded,
  ExtensionRemoved,
  ConfigurationUpdated,
  AddressConfigurationUpdated,
  DaoRegistry,
} from "./generated/DaoRegistry/DaoRegistry";
import { OffchainVotingContract } from "./generated/DaoRegistry/OffchainVotingContract";
import { VotingContract } from "./generated/DaoRegistry/VotingContract";
import { IVoting } from "./generated/DaoRegistry/IVoting";

import { Adapter, Extension, Proposal, Member, TributeDao, Vote } from "./generated/schema";

function loadAndSaveTributeDao(event: ExtensionAdded): void {
  let tributeDao = TributeDao.load(event.address.toHex())

  if (tributeDao == null) {
    tributeDao = new TributeDao(event.address.toHex());

    tributeDao.daoAddress = event.address;
    tributeDao.creator = event.transaction.from
    tributeDao.createdAt = event.block.timestamp;
    tributeDao.name = ""; // @todo

    tributeDao.save();
  }
}

function loadProposalAndSaveVoteResults(
  daoAddress: Address,
  proposalId: Bytes
): Proposal | null {
  // load the existing proposal
  let maybeProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());
  let proposal = Proposal.load(maybeProposalId);

  if (proposal) {
    let voteId = daoAddress
      .toHex()
      .concat("-vote-")
      .concat(proposalId.toHex());
    let vote = new Vote(voteId);

    // get the voting adapter address from the proposal
    let votingAdapterAddress: Bytes = proposal.votingAdapter as Bytes;

    if (votingAdapterAddress) {
      let votingIContract = IVoting.bind(
        Address.fromString(votingAdapterAddress.toHex()) as Address
      );
      let votingAdapterName = votingIContract.getAdapterName();

      if (votingAdapterName == "VotingContract") {
        let votingContract = VotingContract.bind(
          Address.fromString(votingAdapterAddress.toHex()) as Address
        );
        // get vote results and voting state
        let voteResults = votingContract.votes(daoAddress, proposalId);
        let voteState = votingContract.voteResult(daoAddress, proposalId);

        // assign voting data
        vote.nbYes = voteResults.value0;
        vote.nbNo = voteResults.value1;

        vote.adapterName = votingAdapterName;
        vote.adapterAddress = votingAdapterAddress;
        vote.proposal = maybeProposalId;

        if (proposal) {
          proposal.nbYes = voteResults.value0;
          proposal.nbNo = voteResults.value1;
          proposal.startingTime = voteResults.value2;

          proposal.votingState = voteState.toString();
          proposal.votingResult = voteId;
        }
      } else if (votingAdapterName == "OffchainVotingContract") {
        let offchainVotingContract = OffchainVotingContract.bind(
          Address.fromString(votingAdapterAddress.toHex()) as Address
        );
        // get vote results and state
        let voteResults = offchainVotingContract.votes(daoAddress, proposalId);
        let voteState = offchainVotingContract.voteResult(
          daoAddress,
          proposalId
        );

        // assign voting data
        vote.nbYes = voteResults.value3;
        vote.nbNo = voteResults.value4;

        vote.adapterName = votingAdapterName;
        vote.adapterAddress = votingAdapterAddress;
        vote.proposal = maybeProposalId;

        if (proposal) {
          proposal.snapshot = voteResults.value0;
          proposal.reporter = voteResults.value1;
          proposal.resultRoot = voteResults.value2;

          proposal.nbYes = voteResults.value3;
          proposal.nbNo = voteResults.value4;

          proposal.startingTime = voteResults.value5;
          proposal.gracePeriodStartingTime = voteResults.value6;
          proposal.isChallenged = voteResults.value7;
          proposal.stepRequested = voteResults.value8;
          proposal.forceFailed = voteResults.value9;
          // @todo its a mapping, not generated in schema
          // proposal.fallbackVotes = voteResults.value??;
          proposal.fallbackVotesCount = voteResults.value10;

          proposal.votingState = voteState.toString();
          proposal.votingResult = voteId;
        }
      }
    }

    vote.save();
  }

  return proposal;
}

export function handleSubmittedProposal(event: SubmittedProposal): void {
  let submittedBy = event.transaction.from;
  let proposalId = event.params.proposalId;
  let daoAddress = event.address;
  let daoProposalId = daoAddress
    .toHex()
    .concat("-proposal-")
    .concat(proposalId.toHex());

  let proposal = Proposal.load(daoProposalId);

  log.info(
    "=============== SubmittedProposal event fired. daoAddress: {}, proposalId: {}",
    [event.address.toHexString(), event.params.proposalId.toHexString()]
  );

  let daoRegistry = DaoRegistry.bind(event.address);
  let data = daoRegistry.proposals(event.params.proposalId);

  log.info("INFO proposals , {}, {}", [
    data.value0.toHexString(), // `adapterAddress`
    data.value1.toString(), // `flags`
  ]);

  let adapterAdddress = data.value0;

  let inverseAdapter = daoRegistry.inverseAdapters(adapterAdddress);

  log.info("INFO inverseAdapter , {}, {}", [
    inverseAdapter.value0.toHexString(), // adapterId
    inverseAdapter.value1.toString(), // acl
  ]);

  if (proposal == null) {
    proposal = new Proposal(daoProposalId);

    proposal.adapterId = inverseAdapter.value0;
    proposal.adapterAddress = adapterAdddress;
    proposal.flags = event.params.flags;
    proposal.submittedBy = submittedBy;
    proposal.proposalId = proposalId;
    proposal.sponsored = false;
    proposal.processed = false;
    proposal.member = submittedBy.toHex();

    proposal.save();
  }

  // getProposalDetails(
  //   inverseAdapter.value0,
  //   adapterAdddress,
  //   daoAddress,
  //   proposalId
  // );
}

export function handleSponsoredProposal(event: SponsoredProposal): void {
  let id = event.params.proposalId;
  let daoAddress = event.address.toHex(); // dao contract address
  let proposalId = daoAddress.concat("-proposal-").concat(id.toHex());

  let proposal = Proposal.load(proposalId);
  let sponsoredAt = event.block.timestamp.toString();

  log.info("=============== SponsoredProposal event fired. proposalId: {}", [
    event.params.proposalId.toHexString(),
  ]);

  if (proposal == null) {
    proposal = new Proposal(proposalId)
  }

  proposal.sponsoredAt = sponsoredAt;
  proposal.sponsored = true;
  proposal.sponsoredBy = event.transaction.from;
  proposal.votingAdapter = event.params.votingAdapter;

  proposal.save();
}

export function handleProcessedProposal(event: ProcessedProposal): void {
  let processedAt = event.block.timestamp.toString();

  log.info("=============== ProcessedProposal event fired. proposalId: {}", [
    event.params.proposalId.toHexString(),
  ]);

  let proposal = loadProposalAndSaveVoteResults(
    event.address,
    event.params.proposalId
  );

  if (proposal) {
    proposal.processed = true;
    proposal.processedAt = processedAt;
    proposal.processedBy = event.transaction.from;

    proposal.save();
  }
}

export function handleUpdateDelegateKey(event: UpdateDelegateKey): void {
  log.info(
    "=============== UpdateDelegateKey event fired. memberAddress {}, newDelegateKey {}",
    [
      event.params.memberAddress.toHexString(),
      event.params.newDelegateKey.toHexString(),
    ]
  );

  let delegateKey = event.params.newDelegateKey;
  let memberId = event.params.memberAddress.toHex();

  let member = Member.load(memberId);

  if (member) {
    member.delegateKey = delegateKey;
    member.save();
  }
}

export function handleAdapterAdded(event: AdapterAdded): void {
  let daoAddress = event.address.toHexString();
  let adapterId = event.params.adapterId;
  let daoAdapterId = daoAddress.concat("-adapter-").concat(adapterId.toHex());

  let adapter = Adapter.load(daoAdapterId);

  log.info("=============== AdapterAdded event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter == null) {
    adapter = new Adapter(daoAdapterId);
    adapter.adapterId = event.params.adapterId;
    adapter.acl = event.params.flags;
    adapter.adapterAddress = event.params.adapterAddress;

    adapter.save();
  }
}

export function handleAdapterRemoved(event: AdapterRemoved): void {
  let daoAddress = event.address.toHexString();
  let adapterId = event.params.adapterId;
  let daoAdapterId = daoAddress.concat("-adapter-").concat(adapterId.toHex());

  let adapter = Adapter.load(daoAdapterId);

  log.info("=============== AdapterRemoved event fired. adapterId: {}", [
    event.params.adapterId.toHexString(),
  ]);

  if (adapter) {
    store.remove("Adapter", daoAdapterId);
  }
}

export function handleExtensionAdded(event: ExtensionAdded): void {
  let daoAddress = event.address.toHexString();
  let extensionId = event.params.extensionId;

  let daoExtensionId = daoAddress
    .concat("-extension-")
    .concat(extensionId.toHex());

  log.info(
    "=============== ExtensionAdded event fired. extensionAddress {}, extensionId {}, daoAddress {}",
    [
      event.params.extensionAddress.toHexString(),
      event.params.extensionId.toHexString(),
      daoAddress,
    ]
  );

  let extension = Extension.load(daoExtensionId);

  if (extension == null) {
    extension = new Extension(daoExtensionId);
  }

  extension.extensionAddress = event.params.extensionAddress;
  extension.extensionId = event.params.extensionId;

  extension.save();

  // create a tributeDao entity, if it doesn't already exist
  loadAndSaveTributeDao(event);
}

export function handleExtensionRemoved(event: ExtensionRemoved): void {
  let daoAddress = event.address.toHexString();
  let extensionId = event.params.extensionId;
  let daoExtensionId = daoAddress
    .concat("-extension-")
    .concat(extensionId.toHex());

  log.info("=============== ExtensionRemoved event fired. extensionId {}", [
    event.params.extensionId.toHexString(),
  ]);
  let extension = Extension.load(daoExtensionId);

  if (extension) {
    store.remove("Extension", daoExtensionId);
  }
}

export function handleConfigurationUpdated(event: ConfigurationUpdated): void {
  log.info(
    "=============== ConfigurationUpdated event fired. key {}, value {}",
    [event.params.key.toHexString(), event.params.value.toHexString()]
  );
}

export function handleAddressConfigurationUpdated(
  event: AddressConfigurationUpdated
): void {
  log.info(
    "=============== AddressConfigurationUpdated event fired. key {}, value {}",
    [event.params.key.toHexString(), event.params.value.toHexString()]
  );
}
