const { assert } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("PaulFundMe", async () => {
  let paulFundMe, deployer, MockV3Aggregator;

  beforeEach(async () => {
    // const accounts = await getSigners()  This is use for getting private keys
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture(["all"]);
    paulFundMe = await ethers.getContract("PaulFundMe", deployer);

    MockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async () => {
    it("sets the aggregator addesses correctly", async () => {
      const response = await paulFundMe.priceFeed();
      assert.equal(response, MockV3Aggregator.address);
    });
  });

  describe("fund", async () => {
    it("Fails if you don't send enough ETH", async () => {
      await paulFundMe.fund();
    });
  });
});
