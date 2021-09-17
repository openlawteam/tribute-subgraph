import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";

import { OffchainVotingContract } from "../../generated/templates/DaoRegistry/OffchainVotingContract";
import { OffchainVotingContract_v1_0_0 } from "../../generated/templates/DaoRegistry/OffchainVotingContract_v1_0_0";
import { VotingContract } from "../../generated/templates/DaoRegistry/VotingContract";
import { IVoting } from "../../generated/templates/DaoRegistry/IVoting";

import { Proposal, Vote } from "../../generated/schema";

export function loadProposalAndSaveVoteResults(
  daoAddress: Address,
  proposalId: Bytes,
  blockNumber: BigInt
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

      // set initial vote values - to prevent this breaking during sync
      vote.nbNo = BigInt.fromI32(0);
      vote.nbYes = BigInt.fromI32(0);
      vote.adapterName = votingAdapterName;
      vote.adapterAddress = votingAdapterAddress;

      if (votingAdapterName == "VotingContract") {
        let votingContract = VotingContract.bind(
          Address.fromString(votingAdapterAddress.toHex()) as Address
        );
        // get vote results and voting state
        let voteResults = votingContract.try_votes(daoAddress, proposalId);
        let voteState = votingContract.voteResult(daoAddress, proposalId);

        if (voteResults.reverted) {
          log.info("VotingContract try_votes reverted, {}", [
            blockNumber.toString(),
          ]);
        } else {
          // assign voting data
          vote.nbYes = voteResults.value.value0;
          vote.nbNo = voteResults.value.value1;

          vote.proposal = maybeProposalId;

          if (proposal) {
            proposal.nbYes = voteResults.value.value0;
            proposal.nbNo = voteResults.value.value1;
            proposal.startingTime = voteResults.value.value2;
            proposal.blockNumber = voteResults.value.value3;

            proposal.votingState = voteState.toString();
            proposal.votingResult = voteId;
          }
        }
      } else if (votingAdapterName == "OffchainVotingContract") {
        // @todo Need a way to import address of the upgraded
        // OffchainVotingContract (at tribute-contracts `v2.2.0`) so that it
        // does not have to be hardcoded here.
        if (
          Address.fromString(votingAdapterAddress.toHex()) ==
          Address.fromString("0xffe158C044bE67C06a869E7DE92F437934c799b1")
        ) {
          log.debug("*********** NEWER OffchainVotingContract", []);

          let offchainVotingContract = OffchainVotingContract.bind(
            Address.fromString(votingAdapterAddress.toHex()) as Address
          );
          // get vote results and state
          let voteResults = offchainVotingContract.try_votes(
            daoAddress,
            proposalId
          );
          let voteState = offchainVotingContract.voteResult(
            daoAddress,
            proposalId
          );

          if (voteResults.reverted) {
            log.info("OffchainVotingContract try_votes reverted, {}", [
              blockNumber.toString(),
            ]);
          } else {
            // assign voting data
            vote.nbYes = voteResults.value.value3;
            vote.nbNo = voteResults.value.value4;

            vote.proposal = maybeProposalId;

            if (proposal) {
              proposal.snapshot = voteResults.value.value0;
              proposal.reporter = voteResults.value.value1;
              proposal.resultRoot = voteResults.value.value2;

              proposal.nbYes = voteResults.value.value3;
              proposal.nbNo = voteResults.value.value4;

              proposal.startingTime = voteResults.value.value5;
              proposal.gracePeriodStartingTime = voteResults.value.value6;
              proposal.isChallenged = voteResults.value.value7;
              proposal.stepRequested = voteResults.value.value8;
              proposal.forceFailed = voteResults.value.value9;
              proposal.fallbackVotesCount = voteResults.value.value10;

              proposal.votingState = voteState.toString();
              proposal.votingResult = voteId;
            }
          }
        } else {
          log.debug("*********** OLDER OffchainVotingContract", []);

          // OffchainVotingContract at tribute-contracts `v1.0.0`
          let offchainVotingContract = OffchainVotingContract_v1_0_0.bind(
            Address.fromString(votingAdapterAddress.toHex()) as Address
          );
          // get vote results and state
          let voteResults = offchainVotingContract.try_votes(
            daoAddress,
            proposalId
          );
          let voteState = offchainVotingContract.voteResult(
            daoAddress,
            proposalId
          );

          if (voteResults.reverted) {
            log.info("OffchainVotingContract try_votes reverted, {}", [
              blockNumber.toString(),
            ]);
          } else {
            // assign voting data
            vote.nbYes = voteResults.value.value3;
            vote.nbNo = voteResults.value.value4;

            vote.proposal = maybeProposalId;

            if (proposal) {
              proposal.snapshot = voteResults.value.value0;
              proposal.reporter = voteResults.value.value1;
              proposal.resultRoot = voteResults.value.value2;

              proposal.nbYes = voteResults.value.value3;
              proposal.nbNo = voteResults.value.value4;

              proposal.startingTime = voteResults.value.value5;
              proposal.gracePeriodStartingTime = voteResults.value.value6;
              proposal.isChallenged = voteResults.value.value7;
              proposal.forceFailed = voteResults.value.value8;
              proposal.fallbackVotesCount = voteResults.value.value9;

              proposal.votingState = voteState.toString();
              proposal.votingResult = voteId;
            }
          }
        }
      }
    }

    vote.save();
  }

  return proposal;
}
