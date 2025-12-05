import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import type { FhevmInstanceConfig } from "@zama-fhe/relayer-sdk/web";
import type { HandleContractPair } from "@zama-fhe/relayer-sdk/bundle";

// UserDecryptResults type - using Record<string, bigint> as fallback
export type UserDecryptResults = Record<string, bigint>;

// 向后兼容别名
export type DecryptedResults = UserDecryptResults;

export type { FhevmInstance, FhevmInstanceConfig, HandleContractPair };

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType;
};

export type FhevmRelayerSDKType = {
  __initialized__?: boolean;
  initSDK: (options?: unknown) => Promise<boolean>;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
    inputVerifierContractAddress: `0x${string}`;
    kmsVerifierContractAddress: `0x${string}`;
  };
};

export type FhevmInitSDKOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type FhevmInitSDKType = (
  options?: FhevmInitSDKOptions
) => Promise<boolean>;

export type FhevmLoadSDKType = () => Promise<void>;

