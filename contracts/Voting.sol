pragma solidity ^0.4.17;


contract Voting {

    struct Proposal {
        string title;
        uint voteCount;

    }

    address addminAddress;

    struct Voter {
        uint proposal;
        bool voted;
        uint randomValue;
    }

    mapping (address => Voter) Voters;

    Proposal[] public proposals;

    event CreatedProposalEvent();
    event CreatedVoteEvent();

    constructor() public{
      addminAddress = msg.sender;
    }

// ランダムな値をセットする、ランダムになってないので改良
    function setRandomValue(address voterAddress) public returns(uint) {
      uint random;
      random = generateRandom();
      /* uint random = uint(sha3(block.timestamp))%10 +1; */
      Voters[voterAddress].randomValue = random;
      return random;
    }
//ランダムな値を持ってくる。
    function getRandomValue(address voterAddress) public view returns (uint) {
      if(voterAddress == msg.sender) {
        return Voters[voterAddress].randomValue;
      }
      else {
        return ;
      }
    }

    function getAdminAddress() public view returns (address) {
      return addminAddress;
    }

    function getIsVoted(address voteraddress) public view returns (bool) {
      return Voters[voteraddress].voted;
    }

    function getNumProposals() public view returns (uint) {
        return proposals.length;
    }

    function getProposal(uint proposalInt) public view returns (uint, string, uint) {
        if (proposals.length > 0) {
            Proposal storage p = proposals[proposalInt]; // Get the proposal
            return (proposalInt, p.title, p.voteCount);
        }
    }

    function addProposal(string title) public returns (bool) {
        Proposal memory proposal;
        emit CreatedProposalEvent();
        proposal.title = title;
        proposals.push(proposal);
        return true;
    }

    function vote(uint randomedProposal) public returns (bool) {
      /* require(proposalInt <= proposals.length); */
      if (Voters[msg.sender].voted == false) { // check duplicate key

        uint proposalInt = randomedProposal - Voters[msg.sender].randomValue;
        require(proposalInt <= proposals.length);
        Proposal storage p = proposals[proposalInt]; // Get the proposal
        p.voteCount += 1;

        Voters[msg.sender].voted = true;
        Voters[msg.sender].proposal = proposalInt;


        emit CreatedVoteEvent();
        return true;
        } else {
          return false;
        }
      }

      function generateRandom() public returns (uint) {
        return 2;
      }

    }
