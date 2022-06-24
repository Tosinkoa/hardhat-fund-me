const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("PaulFundMe", async () => {
      let paulFundMe, deployer, mockV3Aggregator;
      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        // const accounts = await getSigners()  This is use for getting private keys
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        paulFundMe = await ethers.getContract("PaulFundMe", deployer);

        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator addesses correctly", async () => {
          const response = await paulFundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          expect(paulFundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("update the amount funded data structure", async () => {
          await paulFundMe.fund({ value: sendValue });
          const response = await paulFundMe.getMapAddressToAmountFunded(
            deployer
          );

          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of getFunders", async () => {
          await paulFundMe.fund({ value: sendValue });
          const funder = await paulFundMe.getFunders(0);
          assert.equal(funder, deployer);
        });

        describe("withdraw", async () => {
          beforeEach(async () => {
            await paulFundMe.fund({ value: sendValue });
          });

          it("withdraw ETH from a single funder", async () => {
            //Arrange
            const startingPaulFundMeBalance =
              await paulFundMe.provider.getBalance(paulFundMe.address);
            const startingDeployerBalance =
              await paulFundMe.provider.getBalance(deployer);

            //Act
            const transactionResponse = await paulFundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingPaulFundMeBalance =
              await paulFundMe.provider.getBalance(paulFundMe.address);
            const endingDeployerBalance = await paulFundMe.provider.getBalance(
              deployer
            );

            //Assert
            assert.equal(endingPaulFundMeBalance.toString(), 0);
            assert.equal(
              startingPaulFundMeBalance.add(startingDeployerBalance).toString(),
              endingDeployerBalance.add(gasCost).toString()
            );
          });
          it("cheaperWithdraw ETH from a single funder", async () => {
            //Arrange
            const startingPaulFundMeBalance =
              await paulFundMe.provider.getBalance(paulFundMe.address);
            const startingDeployerBalance =
              await paulFundMe.provider.getBalance(deployer);

            //Act
            const transactionResponse = await paulFundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingPaulFundMeBalance =
              await paulFundMe.provider.getBalance(paulFundMe.address);
            const endingDeployerBalance = await paulFundMe.provider.getBalance(
              deployer
            );

            //Assert
            assert.equal(endingPaulFundMeBalance.toString(), 0);
            assert.equal(
              startingPaulFundMeBalance.add(startingDeployerBalance).toString(),
              endingDeployerBalance.add(gasCost).toString()
            );
          });
        });

        it("allows us to withdraw with multiple getFunders", async () => {
          //Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectionContract = await paulFundMe.connect(
              accounts[i]
            );
            fundMeConnectionContract.fund({ value: sendValue });
          }
          const startingPaulFundMeBalance =
            await paulFundMe.provider.getBalance(paulFundMe.address);
          const startingDeployerBalance = await paulFundMe.provider.getBalance(
            deployer
          );

          //Act
          const transactionResponse = await paulFundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //Make sure getFunders are reset reset properly
          await expect(paulFundMe.getFunders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await paulFundMe.getMapAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await paulFundMe.connect(attacker);
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "PaulFundMe__NotOwner"
          );
        });

        it("cheaperWithdraw testing...", async () => {
          //Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectionContract = await paulFundMe.connect(
              accounts[i]
            );
            fundMeConnectionContract.fund({ value: sendValue });
          }
          const startingPaulFundMeBalance =
            await paulFundMe.provider.getBalance(paulFundMe.address);
          const startingDeployerBalance = await paulFundMe.provider.getBalance(
            deployer
          );

          //Act
          const transactionResponse = await paulFundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          //Make sure s_getFunders are reset reset properly
          await expect(paulFundMe.getFunders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await paulFundMe.getMapAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
      });
    });
