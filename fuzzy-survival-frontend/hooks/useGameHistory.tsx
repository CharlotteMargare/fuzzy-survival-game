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
import { GameHistoryABI } from "@/abi/GameHistoryABI";
import { GameHistoryAddresses } from "@/abi/GameHistoryAddresses";

export type GameHistoryRecord = {
  gameIndex: number;
  finalHP: number | null; // null means encrypted/not decrypted yet
  finalPotionCount: number | null; // null means encrypted/not decrypted yet
  roomsExplored: number;
  finalPosition: number;
  timestamp: number;
  exists: boolean;
  finalHPHandle?: string; // Store encrypted handle for decryption
  finalPotionCountHandle?: string; // Store encrypted handle for decryption
};

export const useGameHistory = (parameters: {
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
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [gameRecords, setGameRecords] = useState<GameHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [gameCount, setGameCount] = useState<number>(0);
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null); // Track which record is being decrypted

  const contractRef = useRef<ethers.Contract | undefined>(undefined);

  // Get contract info
  const contractInfo = useMemo(() => {
    if (!chainId || !ethersReadonlyProvider) {
      return undefined;
    }

    const entry = GameHistoryAddresses[chainId.toString() as keyof typeof GameHistoryAddresses];
    if (!entry) {
      return undefined;
    }

    return {
      address: entry.address as `0x${string}`,
      abi: GameHistoryABI.abi,
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
    ) as any;
  }, [contractInfo, ethersReadonlyProvider]);

  contractRef.current = contract;

  // Load game count
  const loadGameCount = useCallback(async (): Promise<number> => {
    if (!contractRef.current || !ethersSigner) {
      return 0;
    }

    try {
      const count = await (contractRef.current as any)?.getGameCount?.(ethersSigner.address);
      return Number(count ?? 0);
    } catch (error) {
      console.warn("Failed to load game count:", error);
      return 0;
    }
  }, [ethersSigner]);

  // Load a single game record (without decryption)
  const loadGameRecord = useCallback(async (gameIndex: number): Promise<GameHistoryRecord | undefined> => {
    if (!contractRef.current || !ethersSigner) {
      return undefined;
    }

    try {
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;

      // Get encrypted record from contract
      const record = await thisContract?.getGameRecord?.(thisEthersSigner.address, gameIndex);
      if (!record || !record.exists) {
        return undefined;
      }

      const finalHPHandle = record.finalHP;
      const finalPotionCountHandle = record.finalPotionCount;
      const roomsExplored = Number(record.roomsExplored ?? 0);
      const finalPosition = Number(record.finalPosition ?? 0);
      const timestamp = Number(record.timestamp ?? 0);

      // Return record with encrypted handles (not decrypted yet)
      return {
        gameIndex,
        finalHP: null, // Encrypted, not decrypted yet
        finalPotionCount: null, // Encrypted, not decrypted yet
        roomsExplored,
        finalPosition,
        timestamp,
        exists: true,
        finalHPHandle: typeof finalHPHandle === 'string' ? finalHPHandle : undefined,
        finalPotionCountHandle: typeof finalPotionCountHandle === 'string' ? finalPotionCountHandle : undefined,
      };
    } catch (error) {
      console.warn(`Failed to load game record ${gameIndex}:`, error);
      return undefined;
    }
  }, [ethersSigner]);

  // Decrypt a single game record
  const decryptGameRecord = useCallback(async (gameIndex: number): Promise<void> => {
    if (!instance || !ethersSigner || !contractInfo?.address) {
      setError("Cannot decrypt: missing dependencies");
      return;
    }

    setDecryptingIndex(gameIndex);
    setError(undefined);

    try {
      const thisContract = contractRef.current as any;
      const thisEthersSigner = ethersSigner;
      const thisContractAddress = contractInfo.address;

      // Get encrypted record from contract
      const record = await thisContract?.getGameRecord?.(thisEthersSigner.address, gameIndex);
      if (!record || !record.exists) {
        setError(`Game record ${gameIndex} does not exist`);
        setDecryptingIndex(null);
        return;
      }

      const finalHPHandle = record.finalHP;
      const finalPotionCountHandle = record.finalPotionCount;

      // Decrypt HP and potion count
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [thisContractAddress],
        thisEthersSigner,
        fhevmDecryptionSignatureStorage
      );
      if (!sig) {
        setError("Cannot get decryption signature");
        setDecryptingIndex(null);
        return;
      }

      const decryptedResults = await instance.userDecrypt(
        [
          { handle: finalHPHandle, contractAddress: thisContractAddress },
          { handle: finalPotionCountHandle, contractAddress: thisContractAddress },
        ],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const finalHP = Number((decryptedResults as Record<string, bigint>)[finalHPHandle]);
      const finalPotionCount = Number((decryptedResults as Record<string, bigint>)[finalPotionCountHandle]);

      // Update the record with decrypted values
      setGameRecords((prevRecords) =>
        prevRecords.map((r) =>
          r.gameIndex === gameIndex
            ? {
                ...r,
                finalHP,
                finalPotionCount,
              }
            : r
        )
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to decrypt game record ${gameIndex}: ${errorMessage}`);
      console.error(`Failed to decrypt game record ${gameIndex}:`, error);
    } finally {
      setDecryptingIndex(null);
    }
  }, [instance, ethersSigner, contractInfo, fhevmDecryptionSignatureStorage]);

  // Load all game records
  const loadAllGameRecords = useCallback(async (): Promise<void> => {
    if (!instance || !ethersSigner || !contractRef.current) {
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      const count = await loadGameCount();
      setGameCount(count);

      if (count === 0) {
        setGameRecords([]);
        setIsLoading(false);
        return;
      }

      // Load all records in parallel (without decryption)
      const recordPromises: Promise<GameHistoryRecord | undefined>[] = [];
      for (let i = 0; i < count; i++) {
        recordPromises.push(loadGameRecord(i));
      }

      const records = await Promise.all(recordPromises);
      const validRecords = records.filter((r): r is GameHistoryRecord => r !== undefined);
      
      // Sort by game index (newest first)
      validRecords.sort((a, b) => b.gameIndex - a.gameIndex);

      setGameRecords(validRecords);
    } catch (error) {
      console.error("Failed to load game records:", error);
      setError(error instanceof Error ? error.message : "Failed to load game records");
    } finally {
      setIsLoading(false);
    }
  }, [instance, ethersSigner, contractRef, loadGameCount, loadGameRecord]);

  // Auto-load records when dependencies are ready
  useEffect(() => {
    if (instance && ethersSigner && contract) {
      loadAllGameRecords();
    }
  }, [instance, ethersSigner, contract, loadAllGameRecords]);

  return {
    gameRecords,
    gameCount,
    isLoading,
    error,
    decryptingIndex,
    loadAllGameRecords,
    decryptGameRecord,
  };
};

