const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//Only run describe block below if we are on development chain
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          // Don't forget to ensure to run test on the same network as MockV3Aggregator locally
          let mockV3Aggregator

          // const sendVlaue ="1000000000000000000" //1 eth
          // or use below for readability
          // Uses ethers.utils.parseEther to create a const with an Ether value of 1
          const sendValue = ethers.utils.parseEther("1")

          //Deploys FundMe contract inside test
          beforeEach(async function () {
              /** Deploying contract with hardhat-deploy. 
   Comes with benefit of delivering FundMe contract with our mocks 
   @dev Tells this script which account you'd like connected to FundMe
   and abstracts just the deployer from getNamedAccounts.
   ALTERNATE SYNTAX:
   ethers.getSigners
   const accounts = ethers.getSigners()
   const accountZero = accounts[0]
   */
              deployer = (await getNamedAccounts()).deployer
              /** 
    * @dev Uses the fixture function from deployments to run through
   all scripts with "all" tag in just one line*/
              await deployments.fixture(["all"])

              /**
    * @dev Uses hardhat-deploy's wrapped version ethers to provide
   getContract function to grab the most recently deployed
   version of any given contract 
    */
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          // Grouping tests around a particular function
          describe("constructor", async function () {
              it("Sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })

          describe("fund", async function () {
              it("Fails if you dont send enough eth", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough ETH"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("adds getFunder to array of getFunder", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder[0]
                  assert.equal(funder, deployer.address)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from a single founder", async function () {
                  //Arrange
                  //1
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  console.log(
                      "startingFundMeBalance:",
                      ethers.utils.formatEther(startingFundMeBalance)
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "startingDeployerBalance:",
                      ethers.utils.formatEther(startingDeployerBalance)
                  )
                  //Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //0
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(
                      "endingFundMeBalance:",
                      ethers.utils.formatEther(endingFundMeBalance)
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "endingDeployerBalance:",
                      ethers.utils.formatEther(endingDeployerBalance)
                  )
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("cheaperWithdraw ETH from a single founder", async function () {
                  //Arrange
                  //1
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  console.log(
                      "startingFundMeBalance:",
                      ethers.utils.formatEther(startingFundMeBalance)
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "startingDeployerBalance:",
                      ethers.utils.formatEther(startingDeployerBalance)
                  )
                  //Act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //0
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(
                      "endingFundMeBalance:",
                      ethers.utils.formatEther(endingFundMeBalance)
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "endingDeployerBalance:",
                      ethers.utils.formatEther(endingDeployerBalance)
                  )
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple getFunder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  console.log(
                      "startingFundMeBalance:",
                      ethers.utils.formatEther(startingFundMeBalance)
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "startingDeployerBalance:",
                      ethers.utils.formatEther(startingDeployerBalance)
                  )

                  //Act
                  const txResponse = await fundMe.withdraw()
                  const txReceipt = await txResponse.wait(1)
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  //0
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(
                      "endingFundMeBalance:",
                      ethers.utils.formatEther(endingFundMeBalance)
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "endingDeployerBalance:",
                      ethers.utils.formatEther(endingDeployerBalance)
                  )
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //Make sure the getFunder array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("allows us to cheaperWithdraw with multiple getFunder", async function () {
                  //Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address)
                  console.log(
                      "startingFundMeBalance:",
                      ethers.utils.formatEther(startingFundMeBalance)
                  )
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "startingDeployerBalance:",
                      ethers.utils.formatEther(startingDeployerBalance)
                  )

                  //Act
                  const txResponse = await fundMe.cheaperWithdraw()
                  const txReceipt = await txResponse.wait(1)
                  //gasCost
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //Assert
                  //0
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  console.log(
                      "endingFundMeBalance:",
                      ethers.utils.formatEther(endingFundMeBalance)
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)
                  console.log(
                      "endingDeployerBalance:",
                      ethers.utils.formatEther(endingDeployerBalance)
                  )
                  //Assert
                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance.add(startingDeployerBalance),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  //Make sure the getFunder array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
