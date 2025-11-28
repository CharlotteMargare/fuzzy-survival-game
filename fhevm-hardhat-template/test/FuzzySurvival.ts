import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FuzzySurvival, FuzzySurvival__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FuzzySurvival")) as FuzzySurvival__factory;
  const contract = (await factory.deploy()) as FuzzySurvival;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("FuzzySurvival", function () {
  let signers: Signers;
  let contract: FuzzySurvival;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("should create a new player with initial HP and potions", async function () {
    const initialHP = 100;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHP = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    const encryptedPotionsAfter = await contract.connect(signers.alice).getPotionCount();
    const clearPotions = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedPotionsAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHP).to.eq(initialHP);
    expect(clearPotions).to.eq(initialPotions);
  });

  it("should prevent creating duplicate players", async function () {
    const initialHP = 100;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    await expect(
      contract
        .connect(signers.alice)
        .createPlayer(
          encryptedHP.handles[0],
          encryptedPotions.handles[0],
          encryptedHP.inputProof,
          encryptedPotions.inputProof
        )
    ).to.be.revertedWith("Player already exists");
  });

  it("should move and consume HP", async function () {
    const initialHP = 100;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    tx = await contract.connect(signers.alice).move(0);
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHP = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHP).to.eq(initialHP - 5);
  });

  it("should attack and take damage", async function () {
    const initialHP = 100;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    const encryptedHPBefore = await contract.connect(signers.alice).getHP();
    const clearHPBefore = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPBefore,
      contractAddress,
      signers.alice
    );

    tx = await contract.connect(signers.alice).attack();
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHPAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHPAfter).to.be.lessThan(clearHPBefore);
    expect(clearHPAfter).to.be.at.least(clearHPBefore - 20);
    expect(clearHPAfter).to.be.at.most(clearHPBefore - 10);
  });

  it("should defend and take reduced damage", async function () {
    const initialHP = 100;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    const encryptedHPBefore = await contract.connect(signers.alice).getHP();
    const clearHPBefore = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPBefore,
      contractAddress,
      signers.alice
    );

    tx = await contract.connect(signers.alice).defend();
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHPAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHPAfter).to.be.lessThan(clearHPBefore);
    expect(clearHPAfter).to.be.at.least(clearHPBefore - 10);
    expect(clearHPAfter).to.be.at.most(clearHPBefore - 5);
  });

  it("should use potion to heal", async function () {
    const initialHP = 50;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    const healAmount = 30;
    const encryptedHeal = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(healAmount)
      .encrypt();

    const encryptedHPBefore = await contract.connect(signers.alice).getHP();
    const clearHPBefore = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPBefore,
      contractAddress,
      signers.alice
    );

    tx = await contract
      .connect(signers.alice)
      .usePotion(encryptedHeal.handles[0], encryptedHeal.inputProof);
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHPAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    const encryptedPotionsAfter = await contract.connect(signers.alice).getPotionCount();
    const clearPotionsAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedPotionsAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHPAfter).to.be.greaterThan(clearHPBefore);
    expect(clearHPAfter).to.be.at.most(100);
    expect(clearPotionsAfter).to.eq(initialPotions - 1);
  });

  it("should prevent HP from going below 0", async function () {
    const initialHP = 3;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    tx = await contract.connect(signers.alice).move(0);
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHPAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHPAfter).to.eq(0);
  });

  it("should prevent HP from exceeding 100", async function () {
    const initialHP = 95;
    const initialPotions = 3;

    const encryptedHP = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialHP)
      .encrypt();

    const encryptedPotions = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(initialPotions)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .createPlayer(
        encryptedHP.handles[0],
        encryptedPotions.handles[0],
        encryptedHP.inputProof,
        encryptedPotions.inputProof
      );
    await tx.wait();

    const healAmount = 30;
    const encryptedHeal = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(healAmount)
      .encrypt();

    tx = await contract
      .connect(signers.alice)
      .usePotion(encryptedHeal.handles[0], encryptedHeal.inputProof);
    await tx.wait();

    const encryptedHPAfter = await contract.connect(signers.alice).getHP();
    const clearHPAfter = await fhevm.userDecryptEuint(
      FhevmType.euint8,
      encryptedHPAfter,
      contractAddress,
      signers.alice
    );

    expect(clearHPAfter).to.eq(100);
  });
});

