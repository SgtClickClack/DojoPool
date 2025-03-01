/**
 * ABI for the CrossChainValidator Ethereum smart contract
 */
export const CrossChainValidatorABI = [
  // Core validation functions
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "tournamentId",
        "type": "string"
      }
    ],
    "name": "verifyTournament",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isValid",
        "type": "bool"
      }
    ],
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
        "internalType": "bytes32",
        "name": "validationHash",
        "type": "bytes32"
      }
    ],
    "name": "recordValidationHash",
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
        "internalType": "bytes32",
        "name": "validationHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "updateValidationHash",
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
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "updateValidationStatus",
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
    "name": "getValidationHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
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
    "name": "getValidationStatus",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
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
    "name": "isTournamentValidated",
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
      }
    ],
    "name": "generateValidationHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  
  // Admin functions
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracleAddress",
        "type": "address"
      }
    ],
    "name": "addOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "oracleAddress",
        "type": "address"
      }
    ],
    "name": "removeOracle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
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
        "internalType": "bytes32",
        "name": "validationHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "validator",
        "type": "address"
      }
    ],
    "name": "TournamentValidated",
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
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "ValidationStatusUpdated",
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
    "name": "ValidationHashUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oracleAddress",
        "type": "address"
      }
    ],
    "name": "OracleAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oracleAddress",
        "type": "address"
      }
    ],
    "name": "OracleRemoved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isPaused",
        "type": "bool"
      }
    ],
    "name": "ValidationPauseStatusChanged",
    "type": "event"
  }
]; 