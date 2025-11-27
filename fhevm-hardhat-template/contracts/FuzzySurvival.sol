// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FuzzySurvival is ZamaEthereumConfig {
    mapping(address => euint8) public playerHP;
    mapping(address => euint8) public potionCount;
    mapping(address => uint8) public playerPosition;
    mapping(address => uint8) public currentRoom;
    mapping(address => bool) public hasPlayer;
    mapping(address => uint8) public maxDepthReached;
    mapping(address => uint16) public roomsExplored;
    mapping(address => bool) public hasWon;
    
    uint8 public constant INITIAL_HP = 100;
    uint8 public constant INITIAL_POTIONS = 3;
    uint8 public constant MIN_HP = 0;
    uint8 public constant MAX_HP = 100;
    uint8 public constant POTION_HEAL_MIN = 20;
    uint8 public constant POTION_HEAL_MAX = 40;
    
    uint8 public constant TARGET_DEPTH = 10;
    uint8 public constant TARGET_ROOMS_EXPLORED = 20;
    
    event PlayerCreated(address indexed player);
    event PlayerReset(address indexed player);
    event PlayerMoved(address indexed player, uint8 newPosition, uint8 newRoom);
    event PlayerAttacked(address indexed player, uint8 damage);
    event PotionUsed(address indexed player);
    event GameOver(address indexed player);
    event Victory(address indexed player, uint8 depth, uint16 roomsExplored);
    
    function createPlayer(
        externalEuint8 encryptedHP,
        externalEuint8 encryptedPotions,
        bytes calldata inputProof,
        bytes calldata potionProof
    ) external {
        require(!hasPlayer[msg.sender], "Player already exists");
        
        euint8 hp = FHE.fromExternal(encryptedHP, inputProof);
        euint8 potions = FHE.fromExternal(encryptedPotions, potionProof);
        
        playerHP[msg.sender] = hp;
        potionCount[msg.sender] = potions;
        playerPosition[msg.sender] = 0;
        currentRoom[msg.sender] = 0;
        hasPlayer[msg.sender] = true;
        maxDepthReached[msg.sender] = 0;
        roomsExplored[msg.sender] = 0;
        hasWon[msg.sender] = false;
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        FHE.allowThis(potionCount[msg.sender]);
        FHE.allow(potionCount[msg.sender], msg.sender);
        
        euint8 initialFeedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(initialFeedbackIndex);
        FHE.allow(initialFeedbackIndex, msg.sender);
        
        emit PlayerCreated(msg.sender);
    }
    
    function resetPlayer(
        externalEuint8 encryptedHP,
        externalEuint8 encryptedPotions,
        bytes calldata inputProof,
        bytes calldata potionProof
    ) external {
        require(hasPlayer[msg.sender], "Player does not exist");
        
        euint8 hp = FHE.fromExternal(encryptedHP, inputProof);
        euint8 potions = FHE.fromExternal(encryptedPotions, potionProof);
        
        playerHP[msg.sender] = hp;
        potionCount[msg.sender] = potions;
        playerPosition[msg.sender] = 0;
        currentRoom[msg.sender] = 0;
        maxDepthReached[msg.sender] = 0;
        roomsExplored[msg.sender] = 0;
        hasWon[msg.sender] = false;
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        FHE.allowThis(potionCount[msg.sender]);
        FHE.allow(potionCount[msg.sender], msg.sender);
        
        euint8 resetFeedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(resetFeedbackIndex);
        FHE.allow(resetFeedbackIndex, msg.sender);
        
        emit PlayerReset(msg.sender);
    }
    
    function move(uint8 direction) external returns (uint8 newRoom, euint8 feedbackIndex) {
        require(hasPlayer[msg.sender], "Player does not exist");
        require(direction < 4, "Invalid direction");
        
        euint8 damage = FHE.asEuint8(5);
        euint8 currentHP = playerHP[msg.sender];
        euint8 newHP = FHE.sub(currentHP, damage);
        
        ebool isUnderflow = FHE.gt(damage, currentHP);
        playerHP[msg.sender] = FHE.select(isUnderflow, FHE.asEuint8(0), newHP);
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        
        playerPosition[msg.sender] = (playerPosition[msg.sender] + 1) % 100;
        currentRoom[msg.sender] = uint8(block.timestamp % 10);
        newRoom = currentRoom[msg.sender];
        
        roomsExplored[msg.sender]++;
        uint8 currentDepth = uint8(roomsExplored[msg.sender] / 2);
        if (currentDepth > maxDepthReached[msg.sender]) {
            maxDepthReached[msg.sender] = currentDepth;
        }
        
        feedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        
        FHE.allowThis(feedbackIndex);
        FHE.allow(feedbackIndex, msg.sender);
        
        emit PlayerMoved(msg.sender, playerPosition[msg.sender], newRoom);
        
        checkVictory();
        checkGameOver();
    }
    
    function attack() external returns (euint8 feedbackIndex) {
        require(hasPlayer[msg.sender], "Player does not exist");
        
        uint8 damageAmount = uint8((block.timestamp % 11) + 10);
        euint8 damage = FHE.asEuint8(damageAmount);
        
        euint8 currentHP = playerHP[msg.sender];
        euint8 newHP = FHE.sub(currentHP, damage);
        
        ebool isUnderflow = FHE.gt(damage, currentHP);
        playerHP[msg.sender] = FHE.select(isUnderflow, FHE.asEuint8(0), newHP);
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        
        feedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(feedbackIndex);
        FHE.allow(feedbackIndex, msg.sender);
        
        emit PlayerAttacked(msg.sender, damageAmount);
        
        checkGameOver();
    }
    
    function defend() external returns (euint8 feedbackIndex) {
        require(hasPlayer[msg.sender], "Player does not exist");
        
        uint8 damageAmount = uint8((block.timestamp % 6) + 5);
        euint8 damage = FHE.asEuint8(damageAmount);
        
        euint8 currentHP = playerHP[msg.sender];
        euint8 newHP = FHE.sub(currentHP, damage);
        
        ebool isUnderflow = FHE.gt(damage, currentHP);
        playerHP[msg.sender] = FHE.select(isUnderflow, FHE.asEuint8(0), newHP);
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        
        feedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(feedbackIndex);
        FHE.allow(feedbackIndex, msg.sender);
        
        emit PlayerAttacked(msg.sender, damageAmount);
        
        checkGameOver();
    }
    
    function usePotion(
        externalEuint8 encryptedHealAmount,
        bytes calldata inputProof
    ) external returns (euint8 feedbackIndex) {
        require(hasPlayer[msg.sender], "Player does not exist");
        
        euint8 potions = potionCount[msg.sender];
        ebool hasPotions = FHE.gt(potions, FHE.asEuint8(0));
        
        euint8 newPotionCount = FHE.sub(potions, FHE.asEuint8(1));
        potionCount[msg.sender] = FHE.select(hasPotions, newPotionCount, potions);
        
        FHE.allowThis(potionCount[msg.sender]);
        FHE.allow(potionCount[msg.sender], msg.sender);
        
        euint8 healAmount = FHE.fromExternal(encryptedHealAmount, inputProof);
        euint8 currentHP = playerHP[msg.sender];
        euint8 newHP = FHE.add(currentHP, healAmount);
        
        ebool isOverflow = FHE.gt(newHP, FHE.asEuint8(MAX_HP));
        playerHP[msg.sender] = FHE.select(isOverflow, FHE.asEuint8(MAX_HP), newHP);
        
        FHE.allowThis(playerHP[msg.sender]);
        FHE.allow(playerHP[msg.sender], msg.sender);
        
        feedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(feedbackIndex);
        FHE.allow(feedbackIndex, msg.sender);
        
        emit PotionUsed(msg.sender);
    }
    
    function getFeedbackIndex(euint8 hp) internal returns (euint8 index) {
        ebool gt80 = FHE.gt(hp, FHE.asEuint8(80));
        ebool gt60 = FHE.gt(hp, FHE.asEuint8(60));
        ebool gt40 = FHE.gt(hp, FHE.asEuint8(40));
        ebool gt20 = FHE.gt(hp, FHE.asEuint8(20));
        
        euint8 index0 = FHE.select(gt80, FHE.asEuint8(0), FHE.asEuint8(1));
        euint8 index1 = FHE.select(gt60, index0, FHE.asEuint8(2));
        euint8 index2 = FHE.select(gt40, index1, FHE.asEuint8(3));
        index = FHE.select(gt20, index2, FHE.asEuint8(4));
    }
    
    function checkGameOver() internal {
        emit GameOver(msg.sender);
    }
    
    function checkVictory() internal {
        if (hasWon[msg.sender]) {
            return;
        }
        
        if (maxDepthReached[msg.sender] >= TARGET_DEPTH || roomsExplored[msg.sender] >= TARGET_ROOMS_EXPLORED) {
            hasWon[msg.sender] = true;
            emit Victory(msg.sender, maxDepthReached[msg.sender], roomsExplored[msg.sender]);
        }
    }
    
    function getHP() external view returns (euint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return playerHP[msg.sender];
    }
    
    function getPotionCount() external view returns (euint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return potionCount[msg.sender];
    }
    
    function getPosition() external view returns (uint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return playerPosition[msg.sender];
    }
    
    function getCurrentRoom() external view returns (uint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return currentRoom[msg.sender];
    }
    
    function getCurrentFeedbackIndex() external returns (euint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        euint8 feedbackIndex = getFeedbackIndex(playerHP[msg.sender]);
        FHE.allowThis(feedbackIndex);
        FHE.allow(feedbackIndex, msg.sender);
        return feedbackIndex;
    }
    
    function getMaxDepthReached() external view returns (uint8) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return maxDepthReached[msg.sender];
    }
    
    function getRoomsExplored() external view returns (uint16) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return roomsExplored[msg.sender];
    }
    
    function getHasWon() external view returns (bool) {
        require(hasPlayer[msg.sender], "Player does not exist");
        return hasWon[msg.sender];
    }
}

