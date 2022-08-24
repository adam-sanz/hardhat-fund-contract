const { assert, expect } = require("chai")
const { ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

//Only run describe block below if we are not on development chain
developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          //Dont need mock here because we assume we're on testnet
          // const sendValue ="1000000000000000000" //1 eth
          // or use below for readability
          // Uses ethers.utils.parseEther to create a const with an Ether value of 1
          const sendValue = ethers.utils.parseEther("0.04")

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(
                  endingBalance.toString(),
                  ethers.utils.parseEther("0")
              )
          })
      })
