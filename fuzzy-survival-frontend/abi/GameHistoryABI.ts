
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const GameHistoryABI = {
  "abi": [
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "gameIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "GameRecordSubmitted",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
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
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "gameCount",
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
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "gameRecords",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "finalHP",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "finalPotionCount",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "roomsExplored",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "finalPosition",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "player",
          "type": "address"
        }
      ],
      "name": "getGameCount",
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
          "internalType": "address",
          "name": "player",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "gameIndex",
          "type": "uint256"
        }
      ],
      "name": "getGameRecord",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "finalHP",
          "type": "bytes32"
        },
        {
          "internalType": "euint8",
          "name": "finalPotionCount",
          "type": "bytes32"
        },
        {
          "internalType": "uint8",
          "name": "roomsExplored",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "finalPosition",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint8",
          "name": "encryptedFinalHP",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint8",
          "name": "encryptedFinalPotionCount",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "hpProof",
          "type": "bytes"
        },
        {
          "internalType": "bytes",
          "name": "potionProof",
          "type": "bytes"
        },
        {
          "internalType": "uint8",
          "name": "roomsExplored",
          "type": "uint8"
        },
        {
          "internalType": "uint8",
          "name": "finalPosition",
          "type": "uint8"
        }
      ],
      "name": "submitGameRecord",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;

