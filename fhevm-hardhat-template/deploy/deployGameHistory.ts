import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedGameHistory = await deploy("GameHistory", {
    from: deployer,
    log: true,
  });

  console.log(`GameHistory contract: `, deployedGameHistory.address);
};
export default func;
func.id = "deploy_gameHistory";
func.tags = ["GameHistory"];


