/**
 * ABI for the DojoTournament Ethereum smart contract
 */
export const DojoTournamentABI = [
  // Tournament management functions
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "registrationDeadline",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "location",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "format",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "gameType",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "entryFee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCrossChain",
        "type": "bool"
      }
    ],
    "name": "createTournament",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "registerForTournament",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "updateTournamentStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "matchId",
        "type": "bytes32"
      }
    ],
    "name": "updatePlayerScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "playerIds",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "finalRanks",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "prizesWei",
        "type": "uint256[]"
      }
    ],
    "name": "submitResults",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "distributePrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "cancelTournament",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View functions
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "getTournament",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "id",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "startTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endTime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "registrationDeadline",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "location",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "format",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "gameType",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "entryFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "prizePool",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxParticipants",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "participantsCount",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "isCrossChain",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          }
        ],
        "internalType": "struct DojoTournament.Tournament",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      }
    ],
    "name": "getPlayerScore",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "getRegisteredPlayers",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      }
    ],
    "name": "isPlayerRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Event definitions
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "entryFee",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "prizePool",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isCrossChain",
        "type": "bool"
      }
    ],
    "name": "TournamentCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "entryFee",
        "type": "uint256"
      }
    ],
    "name": "PlayerRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "TournamentStatusUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "score",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "matchId",
        "type": "bytes32"
      }
    ],
    "name": "PlayerScoreUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string[]",
        "name": "playerIds",
        "type": "string[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "finalRanks",
        "type": "uint256[]"
      },
      {
        "indexed": false,
        "internalType": "uint256[]",
        "name": "prizesWei",
        "type": "uint256[]"
      }
    ],
    "name": "TournamentResultsSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "playerId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "playerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      }
    ],
    "name": "PrizeDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "TournamentCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "validationHash",
        "type": "bytes32"
      }
    ],
    "name": "CrossChainValidationRequested",
    "type": "event"
  }
]; 