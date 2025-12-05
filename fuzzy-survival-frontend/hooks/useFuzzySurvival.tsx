"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { useEthersSigner } from "@/hooks/wallet/useEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { FuzzySurvivalABI } from "@/abi/FuzzySurvivalABI";
import { FuzzySurvivalAddresses } from "@/abi/FuzzySurvivalAddresses";
import { GameHistoryABI } from "@/abi/GameHistoryABI";
import { GameHistoryAddresses } from "@/abi/GameHistoryAddresses";

export type GameFeedback = {
  feedbackText: string;
  feedbackIndex: number;
};

export type GameState = {
  hasPlayer: boolean;
  position: number;
  currentRoom: number;
  potionCount?: number; // Decrypted potion count
  maxDepthReached?: number; // Maximum depth reached
  roomsExplored?: number; // Total rooms explored
  hasWon?: boolean; // Victory status
};

const FEEDBACK_TEXTS = [
  "You feel energetic and alert.",
  "You feel slightly tired, but still strong.",
  "Your breathing becomes heavier. Something feels off.",
  "Your vision starts to blur. Your hands tremble slightly...",
  "Darkness creeps at the edges of your vision. Every step is a struggle...",
];

export const useFuzzySurvival = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
  autoInitialize?: boolean; // Whether to auto-initialize game on mount (default: true)
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    autoInitialize = true, // Default to true for backward compatibility
  } = parameters;

  const [gameState, setGameState] = useState<GameState | undefined>(undefined);
  const [lastFeedback, setLastFeedback] = useState<GameFeedback | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const hasSubmittedHistoryRef = useRef<boolean>(false); // Track if history has been submitted for this game

  const contractRef = useRef<ethers.Contract | undefined>(undefined);
  const gameHistoryContractRef = useRef<ethers.Contract | undefined>(undefined);
  const gameStateRef = useRef<GameState | undefined>(undefined);

  // Get contract info
  const contractInfo = useMemo(() => {
    if (!chainId || !ethersReadonlyProvider) {
      return undefined;
    }

    const entry = FuzzySurvivalAddresses[chainId.toString() as keyof typeof FuzzySurvivalAddresses];

    if (!entry || entry.address === ethers.ZeroAddress) {
      return { abi: FuzzySurvivalABI.abi, chainId };
    }

    return {
      address: entry.address as `0x${string}`,
      abi: FuzzySurvivalABI.abi,
      chainId: entry.chainId ?? chainId,
      chainName: entry.chainName,
    };
  }, [chainId, ethersReadonlyProvider]);

  const contract = useMemo(() => {
    if (!contractInfo?.address || !contractInfo.abi || !ethersReadonlyProvider) {
      return undefined;
    }
    return new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      ethersReadonlyProvider
    ) as any; // Type will be properly generated after contract deployment
  }, [contractInfo, ethersReadonlyProvider]);

  contractRef.current = contract;
  
  // Helper function to decrypt HP and print to console
  const refreshAndLogHP = useCallback(async (): Promise<number | undefined> => {
    if (!instance || !ethersSigner || !contractRef.current || !contractInfo?.address) {
      return undefined;
    }
    
    try {
      const hpHandle = await (contractRef.current as any)?.getHP?.();
      if (!hpHandle || hpHandle === ethers.ZeroHash) {
        return undefined;
      }
      
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractInfo.address],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );
      
      if (!sig) {
        return undefined;
      }
      
      const decryptedResults = await instance.userDecrypt(
        [{ handle: hpHandle, contractAddress: contractInfo.address }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      
      const hp = Number((decryptedResults as Record<string, bigint>)[hpHandle]);
      console.log(`[HP] Current HP: ${hp}`);
      
      // Check if game is over (HP = 0)
      if (hp === 0) {
        console.log(`[Game Over] HP reached 0! Setting isGameOver to true...`);
        setIsGameOver(true);
        console.log(`[Game Over] isGameOver state updated`);
        
        // Submit game history when game ends (use ref to get latest gameState)
        const currentGameState = gameStateRef.current;
        if (currentGameState) {
          console.log(`[Game History] Preparing to submit: HP=${hp}, Rooms=${currentGameState.currentRoom}, Position=${currentGameState.position}`);
          submitGameHistory(hp, currentGameState.currentRoom, currentGameState.position).catch((err) => {
            console.warn("Failed to submit game history:", err);
          });
        } else {
          console.warn("[Game History] Cannot submit: gameState is not available");
        }
      }
      
      return hp;
    } catch (error) {
      console.warn("Failed to decrypt HP:", error);
      return undefined;
    }
  }, [instance, ethersSigner, contractInfo, fhevmDecryptionSignatureStorage]);
  
  // Helper function to decrypt potion count
  const refreshPotionCount = useCallback(async (): Promise<number | undefined> => {
    if (!instance || !ethersSigner || !contractRef.current || !contractInfo?.address) {
      return undefined;
    }
    
    try {
      const potionCountHandle = await (contractRef.current as any)?.getPotionCount?.();
      if (!potionCountHandle || potionCountHandle === ethers.ZeroHash) {
        return undefined;
      }
      
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractInfo.address],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );
      
      if (!sig) {
        return undefined;
      }
      
      const decryptedResults = await instance.userDecrypt(
        [{ handle: potionCountHandle, contractAddress: contractInfo.address }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      
      return Number((decryptedResults as Record<string, bigint>)[potionCountHandle]);
    } catch (error) {
      console.warn("Failed to decrypt potion count:", error);
      return undefined;
    }
  }, [instance, ethersSigner, contractInfo, fhevmDecryptionSignatureStorage]);

  // Submit game history to GameHistory contract
  const submitGameHistory = useCallback(async (finalHP: number, roomsExplored: number, finalPosition: number): Promise<void> => {
    // Prevent duplicate submissions
    if (hasSubmittedHistoryRef.current) {
      console.log(`[Game History] History already submitted for this game, skipping...`);
      return;
    }
    
    if (!instance || !ethersSigner || !chainId) {
      console.warn("Cannot submit game history: missing dependencies");
      return;
    }

    try {
      // Get GameHistory contract info
      const gameHistoryAddresses = GameHistoryAddresses[chainId.toString() as keyof typeof GameHistoryAddresses];
      if (!gameHistoryAddresses || gameHistoryAddresses.address === "0x0000000000000000000000000000000000000000") {
        console.warn("GameHistory contract not deployed on this network");
        return;
      }

      const gameHistoryContract = new ethers.Contract(
        gameHistoryAddresses.address,
        GameHistoryABI.abi,
        ethersSigner
      ) as any;

      gameHistoryContractRef.current = gameHistoryContract;

      // Get final potion count
      const potionHandle = await (contractRef.current as any)?.getPotionCount?.();
      if (!potionHandle || potionHandle === ethers.ZeroHash) {
        console.warn("Cannot get potion count for history");
        return;
      }

      // Decrypt potion count
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [contractInfo?.address as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );
      if (!sig) {
        console.warn("Cannot get decryption signature for potion count");
        return;
      }

      const potionDecryptedResults = await instance.userDecrypt(
        [{ handle: potionHandle, contractAddress: contractInfo?.address as `0x${string}` }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );
      const finalPotionCount = Number((potionDecryptedResults as Record<string, bigint>)[potionHandle]);

      // Encrypt final HP and potion count for GameHistory contract
      const inputHP = instance.createEncryptedInput(
        gameHistoryAddresses.address as `0x${string}`,
        ethersSigner.address
      );
      inputHP.add8(finalHP);

      const inputPotions = instance.createEncryptedInput(
        gameHistoryAddresses.address as `0x${string}`,
        ethersSigner.address
      );
      inputPotions.add8(finalPotionCount);

      const encHP = await inputHP.encrypt();
      const encPotions = await inputPotions.encrypt();

      // Submit game record
      console.log(`[Game History] Submitting game record: HP=${finalHP}, Potions=${finalPotionCount}, Rooms=${roomsExplored}, Position=${finalPosition}`);
      
      const tx = await gameHistoryContract.submitGameRecord(
        encHP.handles[0],
        encPotions.handles[0],
        encHP.inputProof,
        encPotions.inputProof,
        roomsExplored, // rooms explored
        finalPosition // final position
      );

      await tx.wait();
      console.log(`[Game History] Game record submitted successfully: ${tx.hash}`);
      
      // Mark as submitted to prevent duplicates
      hasSubmittedHistoryRef.current = true;
    } catch (error) {
      console.error("Failed to submit game history:", error);
      throw error;
    }
  }, [instance, ethersSigner, chainId, contractInfo, fhevmDecryptionSignatureStorage]);

  const initializeGame = useCallback(async () => {
    if (!instance || !ethersSigner || !contract) {
      return;
    }

    if (isInitialized) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const thisChainId = chainId;
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;

      // Check if player exists
      const hasPlayer = await thisContract?.hasPlayer?.(ethersSigner.address);

      if (!hasPlayer) {
        // Create new player
        const initialHP = 100;
        const initialPotions = 3;

        const inputHP = instance.createEncryptedInput(
          thisContract?.target as `0x${string}`,
          ethersSigner.address
        );
        inputHP.add8(initialHP);

        const inputPotions = instance.createEncryptedInput(
          thisContract?.target as `0x${string}`,
          ethersSigner.address
        );
        inputPotions.add8(initialPotions);

        const encHP = await inputHP.encrypt();
        const encPotions = await inputPotions.encrypt();

      const tx = await (thisContract as any)
        ?.connect(thisEthersSigner)
        ?.createPlayer?.(
            encHP.handles[0],
            encPotions.handles[0],
            encHP.inputProof,
            encPotions.inputProof
          );
        await tx?.wait();
      }

      // Load game state
      const position = await (thisContract as any)?.getPosition?.();
      const currentRoom = await (thisContract as any)?.getCurrentRoom?.();
      const maxDepthReached = await (thisContract as any)?.getMaxDepthReached?.();
      const roomsExplored = await (thisContract as any)?.getRoomsExplored?.();
      const hasWonStatus = await (thisContract as any)?.getHasWon?.();
      
      // Log initial HP and refresh potion count
      await refreshAndLogHP();
      const potionCount = await refreshPotionCount();
      
      setHasWon(Boolean(hasWonStatus));
      
      // Get initial feedback index
      // Note: Since createPlayer now authorizes the feedback index, we can directly use getCurrentFeedbackIndex
      // But we still need to call it as a transaction first to ensure authorization, then use staticCall to get the handle
      try {
        // First, call getCurrentFeedbackIndex as a transaction to authorize the handle (if not already authorized)
        // This is safe to call even if already authorized
        try {
          const authTx = await (thisContract as any)
            ?.connect(thisEthersSigner)
            ?.getCurrentFeedbackIndex?.();
          await authTx?.wait();
        } catch (authError) {
          // If authorization fails, the handle might already be authorized from createPlayer
          console.log("[Initialize] Authorization may already be done:", authError);
        }
        
        // Wait a bit for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Now get the authorized handle using staticCall
        const feedbackIndexHandle = await (thisContract as any)?.getCurrentFeedbackIndex?.staticCall?.();
        if (feedbackIndexHandle && feedbackIndexHandle !== ethers.ZeroHash && instance) {
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [contractInfo?.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );
          if (sig) {
            const decryptedResults = await instance.userDecrypt(
              [{ handle: feedbackIndexHandle, contractAddress: contractInfo?.address as `0x${string}` }],
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );
            const clearIndex = Number((decryptedResults as Record<string, bigint>)[feedbackIndexHandle]);
            const feedbackIndex = Math.max(0, Math.min(4, clearIndex));
            const feedback: GameFeedback = {
              feedbackText: FEEDBACK_TEXTS[feedbackIndex] || FEEDBACK_TEXTS[0],
              feedbackIndex,
            };
            console.log(`[Initialize] Initial feedback index: ${feedbackIndex}, text: ${feedback.feedbackText}`);
            setLastFeedback(feedback);
          }
        }
      } catch (feedbackError) {
        console.warn("Failed to get initial feedback:", feedbackError);
        // Set a default feedback if decryption fails (HP = 100 should be index 0)
        const defaultFeedback: GameFeedback = {
          feedbackText: FEEDBACK_TEXTS[0] || "You feel slightly tired, but still strong.",
          feedbackIndex: 0,
        };
        setLastFeedback(defaultFeedback);
      }

      if (
        sameChain.current(thisChainId) &&
        sameSigner.current(thisEthersSigner)
      ) {
        const hasWonValue = Boolean(hasWonStatus);
        
        // Check for victory on initialization (submission will be handled by useEffect)
        if (hasWonValue && !hasWon) {
          setHasWon(true);
          console.log(`[Victory] Player has won! Depth: ${maxDepthReached}, Rooms: ${roomsExplored}`);
        }
        
        setGameState({
          hasPlayer: true,
          position: Number(position),
          currentRoom: Number(currentRoom),
          potionCount,
          maxDepthReached: Number(maxDepthReached ?? 0),
          roomsExplored: Number(roomsExplored ?? 0),
          hasWon: hasWonValue,
        });
        setIsInitialized(true);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to initialize game: ${errorMessage}`);
      console.error("Failed to initialize game:", e);
    } finally {
      setIsLoading(false);
    }
  }, [instance, ethersSigner, contract, chainId, sameChain, sameSigner, isInitialized]);

  const move = useCallback(
    async (direction: 0 | 1 | 2 | 3): Promise<GameFeedback | undefined> => {
      if (!instance || !ethersSigner || !contract || !contractInfo?.address) {
        return undefined;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const thisChainId = chainId;
        const thisContract = contractRef.current as any;
        const thisEthersSigner = ethersSigner;
        const thisContractAddress = contractInfo.address;

      // Execute the transaction
      // Note: move() returns (uint8 newRoom, euint8 feedbackIndex)
      // We need to use staticCall to get the return value, but that won't work for state-changing functions
      // So we'll call getCurrentFeedbackIndex() after the transaction
      const tx = await (thisContract as any)
        ?.connect(thisEthersSigner)
        ?.move?.(direction);
      const receipt = await tx?.wait();
      
      // After the transaction, get the feedback index handle using staticCall
      // This handle is already authorized by the move() function
      let feedbackIndexHandle: string | undefined;
      try {
        // Use staticCall to get the return value without sending a transaction
        const result = await (thisContract as any)
          ?.connect(thisEthersSigner)
          ?.getCurrentFeedbackIndex?.staticCall?.();
        
        console.log(`[Move] getCurrentFeedbackIndex staticCall result:`, result);
        
        if (typeof result === 'string' && result.startsWith('0x')) {
          feedbackIndexHandle = result;
        } else if (Array.isArray(result) && result.length > 0) {
          feedbackIndexHandle = result[0];
        } else if (result && typeof result === 'object' && 'handle' in result) {
          feedbackIndexHandle = result.handle;
        }
        
        console.log(`[Move] Extracted feedbackIndexHandle:`, feedbackIndexHandle);
      } catch (getFeedbackError) {
        console.error("Failed to get feedback index:", getFeedbackError);
        // If this fails, we'll skip decryption and use fallback
      }

      // Refresh position and room after move
      if (sameChain.current(thisChainId) && sameSigner.current(thisEthersSigner)) {
        try {
          const position = await (thisContract as any)?.getPosition?.();
          const currentRoom = await (thisContract as any)?.getCurrentRoom?.();
          
          if (position !== undefined && currentRoom !== undefined) {
            const potionCount = await refreshPotionCount();
            const maxDepthReached = await (thisContract as any)?.getMaxDepthReached?.();
            const roomsExplored = await (thisContract as any)?.getRoomsExplored?.();
            const hasWonStatus = await (thisContract as any)?.getHasWon?.();
            
            setGameState({
              hasPlayer: true,
              position: Number(position),
              currentRoom: Number(currentRoom),
              potionCount,
              maxDepthReached: Number(maxDepthReached ?? 0),
              roomsExplored: Number(roomsExplored ?? 0),
              hasWon: hasWonStatus || false,
            });
            
            // Check for victory (submission will be handled by useEffect)
            if (hasWonStatus && !hasWon) {
              setHasWon(true);
              console.log(`[Victory] Player has won! Depth: ${maxDepthReached}, Rooms: ${roomsExplored}`);
            }
          }
        } catch (refreshError) {
          console.error("Failed to refresh position:", refreshError);
        }
      }

      if (
        sameChain.current(thisChainId) &&
        sameSigner.current(thisEthersSigner) &&
        feedbackIndexHandle &&
        instance &&
        feedbackIndexHandle !== ethers.ZeroHash
      ) {
        try {
          // Decrypt feedback index
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisContractAddress],
            thisEthersSigner,
            fhevmDecryptionSignatureStorage
          );

          if (sig) {
            console.log(`[Move] Attempting to decrypt feedbackIndexHandle: ${feedbackIndexHandle}, contractAddress: ${thisContractAddress}`);
            console.log(`[Move] Signature info:`, {
              contractAddresses: sig.contractAddresses,
              userAddress: sig.userAddress,
            });
            
            try {
              const decryptedResults = await instance.userDecrypt(
                [{ handle: feedbackIndexHandle, contractAddress: thisContractAddress }],
                sig.privateKey,
                sig.publicKey,
                sig.signature,
                sig.contractAddresses,
                sig.userAddress,
                sig.startTimestamp,
                sig.durationDays
              );

              console.log(`[Move] Decryption results:`, decryptedResults);

              const clearIndex = Number((decryptedResults as Record<string, bigint>)[feedbackIndexHandle]);
              const feedbackIndex = Math.max(0, Math.min(4, clearIndex));
              const feedback: GameFeedback = {
                feedbackText: FEEDBACK_TEXTS[feedbackIndex] || FEEDBACK_TEXTS[0],
                feedbackIndex,
              };
              console.log(`[Move] Decrypted feedback index: ${feedbackIndex}, text: ${feedback.feedbackText}`);
              setLastFeedback(feedback);
              
              // Log HP after move
              await refreshAndLogHP();
              
              return feedback;
            } catch (decryptError) {
              console.error(`[Move] Decryption error:`, decryptError);
              throw decryptError;
            }
          } else {
            console.warn(`[Move] No decryption signature available`);
          }
        } catch (decryptError) {
          console.error("Failed to decrypt feedback index:", decryptError);
        }
      }
      
      // Log HP even if decryption fails
      await refreshAndLogHP();
      
      // Fallback: if decryption fails, use a default index
      // This should not happen in normal operation, but provides graceful degradation
      console.warn(`[Move] Decryption failed, using fallback feedback index 2`);
      const feedbackIndex = 2;
      const feedback: GameFeedback = {
        feedbackText: FEEDBACK_TEXTS[feedbackIndex],
        feedbackIndex,
      };
      setLastFeedback(feedback);
      return feedback;
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        setError(`Move failed: ${errorMessage}`);
        console.error("Move failed:", e);
      } finally {
        setIsLoading(false);
      }
      return undefined;
    },
    [instance, ethersSigner, contract, contractInfo, chainId, sameChain, sameSigner, fhevmDecryptionSignatureStorage, refreshPotionCount, refreshAndLogHP]
  );

  const attack = useCallback(async (): Promise<GameFeedback | undefined> => {
    if (!instance || !ethersSigner || !contract || !contractInfo?.address) {
      return undefined;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const thisChainId = chainId;
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;
      const thisContractAddress = contractInfo.address;

      // Execute the transaction
      const tx = await (thisContract as any)?.connect?.(thisEthersSigner)?.attack?.();
      await tx?.wait();
      
      // After the transaction, get the feedback index handle from the view function
      // This handle is already authorized by the attack() function
      let feedbackIndexHandle: string | undefined;
      try {
        const result = await (thisContract as any)
          ?.connect(thisEthersSigner)
          ?.getCurrentFeedbackIndex?.staticCall?.();
        
        if (typeof result === 'string' && result.startsWith('0x')) {
          feedbackIndexHandle = result;
        } else if (Array.isArray(result) && result.length > 0) {
          feedbackIndexHandle = result[0];
        }
      } catch (getFeedbackError) {
        console.warn("Failed to get feedback index:", getFeedbackError);
        // If this fails, we'll skip decryption and use fallback
      }

      if (
        sameChain.current(thisChainId) &&
        sameSigner.current(thisEthersSigner) &&
        feedbackIndexHandle &&
        instance &&
        feedbackIndexHandle !== ethers.ZeroHash
      ) {
        try {
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisContractAddress],
            thisEthersSigner,
            fhevmDecryptionSignatureStorage
          );

          if (sig) {
            const decryptedResults = await instance.userDecrypt(
              [{ handle: feedbackIndexHandle, contractAddress: thisContractAddress }],
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );

            const clearIndex = Number((decryptedResults as Record<string, bigint>)[feedbackIndexHandle]);
            const feedbackIndex = Math.max(0, Math.min(4, clearIndex));
            const feedback: GameFeedback = {
              feedbackText: FEEDBACK_TEXTS[feedbackIndex] || FEEDBACK_TEXTS[0],
              feedbackIndex,
            };
            console.log(`[Attack] Decrypted feedback index: ${feedbackIndex}, text: ${feedback.feedbackText}`);
            setLastFeedback(feedback);
            
            // Log HP after attack
            await refreshAndLogHP();
            
            return feedback;
          }
        } catch (decryptError) {
          console.error("Failed to decrypt feedback index:", decryptError);
        }
      }

      // Log HP even if decryption fails
      await refreshAndLogHP();

      // Fallback
      const feedbackIndex = 2;
      const feedback: GameFeedback = {
        feedbackText: FEEDBACK_TEXTS[feedbackIndex],
        feedbackIndex,
      };
      setLastFeedback(feedback);
      return feedback;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Attack failed: ${errorMessage}`);
      console.error("Attack failed:", e);
    } finally {
      setIsLoading(false);
    }
    return undefined;
  }, [instance, ethersSigner, contract, contractInfo, chainId, sameChain, sameSigner, fhevmDecryptionSignatureStorage, refreshAndLogHP]);

  const defend = useCallback(async (): Promise<GameFeedback | undefined> => {
    if (!instance || !ethersSigner || !contract || !contractInfo?.address) {
      return undefined;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const thisChainId = chainId;
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;
      const thisContractAddress = contractInfo.address;

      // Execute the transaction
      const tx = await (thisContract as any)?.connect?.(thisEthersSigner)?.defend?.();
      await tx?.wait();
      
      // After the transaction, get the feedback index handle from the view function
      // This handle is already authorized by the defend() function
      let feedbackIndexHandle: string | undefined;
      try {
        const result = await (thisContract as any)
          ?.connect(thisEthersSigner)
          ?.getCurrentFeedbackIndex?.staticCall?.();
        
        if (typeof result === 'string' && result.startsWith('0x')) {
          feedbackIndexHandle = result;
        } else if (Array.isArray(result) && result.length > 0) {
          feedbackIndexHandle = result[0];
        }
      } catch (getFeedbackError) {
        console.warn("Failed to get feedback index:", getFeedbackError);
        // If this fails, we'll skip decryption and use fallback
      }

      if (
        sameChain.current(thisChainId) &&
        sameSigner.current(thisEthersSigner) &&
        feedbackIndexHandle &&
        instance &&
        feedbackIndexHandle !== ethers.ZeroHash
      ) {
        try {
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisContractAddress],
            thisEthersSigner,
            fhevmDecryptionSignatureStorage
          );

          if (sig) {
            const decryptedResults = await instance.userDecrypt(
              [{ handle: feedbackIndexHandle, contractAddress: thisContractAddress }],
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );

            const clearIndex = Number((decryptedResults as Record<string, bigint>)[feedbackIndexHandle]);
            const feedbackIndex = Math.max(0, Math.min(4, clearIndex));
            const feedback: GameFeedback = {
              feedbackText: FEEDBACK_TEXTS[feedbackIndex] || FEEDBACK_TEXTS[0],
              feedbackIndex,
            };
            console.log(`[Defend] Decrypted feedback index: ${feedbackIndex}, text: ${feedback.feedbackText}`);
            setLastFeedback(feedback);
            
            // Log HP after defend
            await refreshAndLogHP();
            
            return feedback;
          }
        } catch (decryptError) {
          console.error("Failed to decrypt feedback index:", decryptError);
        }
      }

      // Log HP even if decryption fails
      await refreshAndLogHP();

      const feedbackIndex = 2;
      const feedback: GameFeedback = {
        feedbackText: FEEDBACK_TEXTS[feedbackIndex],
        feedbackIndex,
      };
      setLastFeedback(feedback);
      return feedback;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Defend failed: ${errorMessage}`);
      console.error("Defend failed:", e);
    } finally {
      setIsLoading(false);
    }
    return undefined;
  }, [instance, ethersSigner, contract, contractInfo, chainId, sameChain, sameSigner, fhevmDecryptionSignatureStorage, refreshAndLogHP]);

  const usePotion = useCallback(async (): Promise<GameFeedback | undefined> => {
    if (!instance || !ethersSigner || !contract || !contractInfo?.address) {
      return undefined;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const thisChainId = chainId;
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;
      const thisContractAddress = contractInfo.address;

      // Random heal amount between 20-40
      const healAmount = Math.floor(Math.random() * 21) + 20;

      const inputHeal = instance.createEncryptedInput(
        thisContract?.target as `0x${string}`,
        ethersSigner.address
      );
      inputHeal.add8(healAmount);

      const encHeal = await inputHeal.encrypt();

      // Execute the transaction
      const tx = await (thisContract as any)
        ?.connect?.(thisEthersSigner)
        ?.usePotion?.(encHeal.handles[0], encHeal.inputProof);
      await tx?.wait();
      
      // After the transaction, get the feedback index handle from the view function
      // This handle is already authorized by the usePotion() function
      let feedbackIndexHandle: string | undefined;
      try {
        const result = await (thisContract as any)
          ?.connect(thisEthersSigner)
          ?.getCurrentFeedbackIndex?.staticCall?.();
        
        if (typeof result === 'string' && result.startsWith('0x')) {
          feedbackIndexHandle = result;
        } else if (Array.isArray(result) && result.length > 0) {
          feedbackIndexHandle = result[0];
        }
      } catch (getFeedbackError) {
        console.warn("Failed to get feedback index:", getFeedbackError);
        // If this fails, we'll skip decryption and use fallback
      }

      if (
        sameChain.current(thisChainId) &&
        sameSigner.current(thisEthersSigner) &&
        feedbackIndexHandle &&
        instance &&
        feedbackIndexHandle !== ethers.ZeroHash
      ) {
        try {
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisContractAddress],
            thisEthersSigner,
            fhevmDecryptionSignatureStorage
          );

          if (sig) {
            const decryptedResults = await instance.userDecrypt(
              [{ handle: feedbackIndexHandle, contractAddress: thisContractAddress }],
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );

            const clearIndex = Number((decryptedResults as Record<string, bigint>)[feedbackIndexHandle]);
            const feedbackIndex = Math.max(0, Math.min(4, clearIndex));
            const feedback: GameFeedback = {
              feedbackText: FEEDBACK_TEXTS[feedbackIndex] || FEEDBACK_TEXTS[0],
              feedbackIndex,
            };
            console.log(`[UsePotion] Decrypted feedback index: ${feedbackIndex}, text: ${feedback.feedbackText}`);
            setLastFeedback(feedback);
            
            // Log HP and refresh potion count after using potion
            await refreshAndLogHP();
            const potionCount = await refreshPotionCount();
            setGameState(prev => prev ? { ...prev, potionCount } : prev);
            
            return feedback;
          }
        } catch (decryptError) {
          console.error("Failed to decrypt feedback index:", decryptError);
        }
      }

      // Log HP and refresh potion count even if decryption fails
      await refreshAndLogHP();
      const potionCount = await refreshPotionCount();
      setGameState(prev => prev ? { ...prev, potionCount } : prev);

      const feedbackIndex = 2;
      const feedback: GameFeedback = {
        feedbackText: FEEDBACK_TEXTS[feedbackIndex],
        feedbackIndex,
      };
      setLastFeedback(feedback);
      return feedback;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Use potion failed: ${errorMessage}`);
      console.error("Use potion failed:", e);
    } finally {
      setIsLoading(false);
    }
    return undefined;
  }, [instance, ethersSigner, contract, contractInfo, chainId, sameChain, sameSigner, fhevmDecryptionSignatureStorage, refreshPotionCount, refreshAndLogHP]);

  // Auto-initialize on mount (only if autoInitialize is true)
  useEffect(() => {
    if (autoInitialize && instance && ethersSigner && contract && !isInitialized) {
      initializeGame();
    }
  }, [autoInitialize, instance, ethersSigner, contract, isInitialized, initializeGame]);
  
  // Sync gameState to ref for use in callbacks
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Debug: Log isGameOver state changes
  useEffect(() => {
    if (isGameOver) {
      console.log(`[useFuzzySurvival] isGameOver state changed to: ${isGameOver}`);
    }
  }, [isGameOver]);
  
  // Submit game history when victory is achieved
  useEffect(() => {
    if (hasWon && gameState && instance && ethersSigner && contractRef.current) {
      console.log(`[Victory] Victory detected, submitting game history...`);
      const currentGameState = gameStateRef.current;
      if (currentGameState) {
        refreshAndLogHP().then((finalHP) => {
          if (finalHP !== undefined) {
            const roomsToSubmit = currentGameState.roomsExplored ?? 0;
            const positionToSubmit = currentGameState.position;
            console.log(`[Game History] Preparing to submit victory record: HP=${finalHP}, Rooms=${roomsToSubmit}, Position=${positionToSubmit}`);
            submitGameHistory(finalHP, roomsToSubmit, positionToSubmit).catch((err) => {
              console.warn("Failed to submit victory game history:", err);
            });
          }
        }).catch((err) => {
          console.warn("Failed to get HP for victory history:", err);
        });
      }
    }
  }, [hasWon, gameState, instance, ethersSigner, refreshAndLogHP, submitGameHistory]);

  // Reset player to initial state (for restarting game)
  const resetPlayer = useCallback(async (): Promise<void> => {
    if (!instance || !ethersSigner || !contractRef.current) {
      console.warn("Cannot reset player: missing dependencies");
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;

      // Check if player exists
      const hasPlayer = await thisContract?.hasPlayer?.(ethersSigner.address);
      if (!hasPlayer) {
        console.warn("Player does not exist, cannot reset");
        setIsLoading(false);
        return;
      }

      // Reset player with initial values
      const initialHP = 100;
      const initialPotions = 3;

      const inputHP = instance.createEncryptedInput(
        thisContract?.target as `0x${string}`,
        ethersSigner.address
      );
      inputHP.add8(initialHP);

      const inputPotions = instance.createEncryptedInput(
        thisContract?.target as `0x${string}`,
        ethersSigner.address
      );
      inputPotions.add8(initialPotions);

      const encHP = await inputHP.encrypt();
      const encPotions = await inputPotions.encrypt();

      const tx = await (thisContract as any)
        ?.connect(thisEthersSigner)
        ?.resetPlayer?.(
          encHP.handles[0],
          encPotions.handles[0],
          encHP.inputProof,
          encPotions.inputProof
        );
      await tx?.wait();

      // Reset game state
      setIsGameOver(false);
      setIsInitialized(false);
      setHasWon(false);
      setGameState(undefined);
      setLastFeedback(undefined);
      gameStateRef.current = undefined;
      hasSubmittedHistoryRef.current = false; // Reset submission flag for new game

      // Re-initialize game (bypass isInitialized check)
      // Load game state
      const position = await (thisContract as any)?.getPosition?.();
      const currentRoom = await (thisContract as any)?.getCurrentRoom?.();
      
      // Log initial HP and refresh potion count
      await refreshAndLogHP();
      const potionCount = await refreshPotionCount();
      
      const newGameState: GameState = {
        hasPlayer: true,
        position: Number(position ?? 0),
        currentRoom: Number(currentRoom ?? 0),
        potionCount,
      };
      setGameState(newGameState);
      gameStateRef.current = newGameState;
      
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to reset player:", error);
      setError(error instanceof Error ? error.message : "Failed to reset player");
    } finally {
      setIsLoading(false);
    }
  }, [instance, ethersSigner, contractRef, refreshAndLogHP, refreshPotionCount]);

  return {
    gameState,
    lastFeedback,
    isLoading,
    error,
    isInitialized,
    isGameOver,
    hasWon,
    initializeGame,
    resetPlayer,
    move,
    attack,
    defend,
    usePotion,
  };
};

