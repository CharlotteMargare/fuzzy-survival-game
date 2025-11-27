// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract GameHistory is ZamaEthereumConfig {
    struct GameRecord {
        euint8 finalHP;
        euint8 finalPotionCount;
        uint8 roomsExplored;
        uint8 finalPosition;
        uint256 timestamp;
        bool exists;
    }
    
    mapping(address => mapping(uint256 => GameRecord)) public gameRecords;
    mapping(address => uint256) public gameCount;
    
    event GameRecordSubmitted(
        address indexed player,
        uint256 indexed gameIndex,
        uint256 timestamp
    );
    
    function submitGameRecord(
        externalEuint8 encryptedFinalHP,
        externalEuint8 encryptedFinalPotionCount,
        bytes calldata hpProof,
        bytes calldata potionProof,
        uint8 roomsExplored,
        uint8 finalPosition
    ) external {
        euint8 finalHP = FHE.fromExternal(encryptedFinalHP, hpProof);
        euint8 finalPotionCount = FHE.fromExternal(encryptedFinalPotionCount, potionProof);
        
        uint256 gameIndex = gameCount[msg.sender];
        
        gameRecords[msg.sender][gameIndex] = GameRecord({
            finalHP: finalHP,
            finalPotionCount: finalPotionCount,
            roomsExplored: roomsExplored,
            finalPosition: finalPosition,
            timestamp: block.timestamp,
            exists: true
        });
        
        FHE.allowThis(finalHP);
        FHE.allow(finalHP, msg.sender);
        FHE.allowThis(finalPotionCount);
        FHE.allow(finalPotionCount, msg.sender);
        
        gameCount[msg.sender]++;
        
        emit GameRecordSubmitted(msg.sender, gameIndex, block.timestamp);
    }
    
    function getGameCount(address player) external view returns (uint256) {
        return gameCount[player];
    }
    
    function getGameRecord(address player, uint256 gameIndex)
        external
        view
        returns (
            euint8 finalHP,
            euint8 finalPotionCount,
            uint8 roomsExplored,
            uint8 finalPosition,
            uint256 timestamp,
            bool exists
        )
    {
        GameRecord storage record = gameRecords[player][gameIndex];
        return (
            record.finalHP,
            record.finalPotionCount,
            record.roomsExplored,
            record.finalPosition,
            record.timestamp,
            record.exists
        );
    }
}


