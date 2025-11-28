import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFuzzySurvival = await deploy("FuzzySurvival", {
    from: deployer,
    log: true,
  });

  console.log(`FuzzySurvival contract: `, deployedFuzzySurvival.address);
};
export default func;
func.id = "deploy_fuzzySurvival"; // id required to prevent reexecution
func.tags = ["FuzzySurvival"];

