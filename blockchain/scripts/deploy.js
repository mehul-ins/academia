const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const Registry = await hre.ethers.getContractFactory("Registry");
  
  // Deploy the contract
  const registry = await Registry.deploy(); // deploy() returns deployed contract in ethers v6

  console.log("Registry deployed to:", registry.target); // use .target in ethers v6
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
