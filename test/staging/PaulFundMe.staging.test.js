const { assert } = require("chai");
const { getNamedAccounts, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("PaulFundMe", async () => {
      let paulFundMe, deployer;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        paulFundMe = await ethers.getContract("PaulFundMe", deployer);
      });

      it("allows people to fund and withdraw", async () => {
        await paulFundMe.fund({ value: sendValue });
        await paulFundMe.withdraw();
        const endingBalance = await paulFundMe.provider.getBalance(
          paulFundMe.address
        );
        assert.equal(endingBalance.toString(), "0");
      });
    });
