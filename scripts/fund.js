const { getNamedAccounts } = require("hardhat");

const main = async () => {
  try {
    const { deployer } = await getNamedAccounts();
    const paulFundMe = await ethers.getContract("PaulFundMe", deployer);
    console.log("Funding Contract...");
    const transactionResponse = await paulFundMe.fund({
      value: ethers.utils.parseEther("0.1"),
    });
    await transactionResponse.wait(1);
    console.log("Funded!");
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
};
