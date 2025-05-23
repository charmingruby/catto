import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { expect } from "chai"
import hre, { ethers } from "hardhat"

describe("Catto", () => {
	async function deployFixture() {
		const [owner, ...accounts] = await hre.ethers.getSigners()

		const Catto = await hre.ethers.getContractFactory("Catto")
		const catto = await Catto.deploy()

		return { contract: catto, owner, accounts }
	}

	describe("Metadata", async () => {
		it("should return the contract name", async () => {
			const { contract } = await loadFixture(deployFixture)

			expect(await contract.name()).to.equal("Catto")
		})

		it("should return the symbol", async () => {
			const { contract } = await loadFixture(deployFixture)

			expect(await contract.symbol()).to.equal("CTT")
		})

		it("should be able to get the URI metadata", async () => {
			const { contract } = await loadFixture(deployFixture)

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			expect(await contract.tokenURI(tokenId)).to.equal("https://catto.xyz/0.json")
		})

		it("should be not able to get URI metadata if does not exists", async () => {
			const { contract } = await loadFixture(deployFixture)

			await expect(contract.tokenURI(0)).
				to.be.revertedWithCustomError(contract, "URIQueryForNonexistentToken")
		})
	})

	describe("Mint", async () => {
		it("should be able to mint", async () => {
			const { contract, owner } = await loadFixture(deployFixture)

			await contract.mint(1, { value: ethers.parseEther("0.01") })

			const balance = await contract.balanceOf(owner.address)
			const tokenId = 0
			const ownerOf = await contract.ownerOf(tokenId)
			const totalSupply = await contract.totalSupply()

			expect(balance).to.equal(1)
			expect(ownerOf).to.equal(owner.address)
			expect(totalSupply).to.equal(1)
		})

		it("should be not able to mint if there is no payment", async () => {
			const { contract, owner } = await loadFixture(deployFixture)

			await expect(contract.mint(1, { value: ethers.parseEther("0") }))
				.to.be.revertedWith("Insufficient payment")
		})

		it("should be able to burn", async () => {
			const { contract, owner } = await loadFixture(deployFixture)

			await contract.mint(1, { value: ethers.parseEther("0.01") })

			const tokenId = 0

			await contract.burn(tokenId)

			const balance = await contract.balanceOf(owner.address)
			const totalSupply = await contract.totalSupply()

			expect(balance).to.equal(0)
			expect(totalSupply).to.equal(0)
		})

		it("should be able to do a delegated burn", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			const delegatedAccount = accounts[0]
			const delegatedAccountInstance = contract.connect(delegatedAccount)

			await contract.approve(delegatedAccount.address, tokenId)
			const approved = await contract.getApproved(tokenId)

			await delegatedAccountInstance.burn(tokenId)

			const balance = await contract.balanceOf(owner.address)
			const totalSupply = await contract.totalSupply()

			expect(balance).to.equal(0)
			expect(totalSupply).to.equal(0)
			expect(approved).to.equal(delegatedAccount.address)
		})

		it("should be able to do burn approved for all", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			const delegatedAccount = accounts[0]
			const delegatedAccountInstance = contract.connect(delegatedAccount)

			await contract.setApprovalForAll(delegatedAccount.address, true)
			const approved = await contract.isApprovedForAll(owner.address, delegatedAccount.address)

			await delegatedAccountInstance.burn(tokenId)

			const balance = await contract.balanceOf(owner.address)
			const totalSupply = await contract.totalSupply()

			expect(balance).to.equal(0)
			expect(totalSupply).to.equal(0)
			expect(approved).to.equal(true)
		})

		it("should be not able to burn if token does not exists", async () => {
			const { contract } = await loadFixture(deployFixture)

			await expect(contract.burn(1))
				.to.be.revertedWithCustomError(contract, "OwnerQueryForNonexistentToken")
		})
	})

	describe("Transfer", async () => {
		it("should be able to transfer", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const recipientAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await contract.transferFrom(owner.address, recipientAccount.address, tokenId)

			const balanceFrom = await contract.balanceOf(owner.address)
			const balanceTo = await contract.balanceOf(recipientAccount.address)
			const ownerOf = await contract.ownerOf(tokenId)
			const totalSupply = await contract.totalSupply()

			expect(totalSupply).to.equal(1)
			expect(balanceFrom).to.equal(0)
			expect(balanceTo).to.equal(1)
			expect(ownerOf).to.equal(recipientAccount.address)
		})

		it("should be not able to transfer without permission", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const forbiddenAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			const forbiddenAccountInstance = contract.connect(forbiddenAccount)

			await expect(forbiddenAccountInstance.transferFrom(owner.address, forbiddenAccount.address, tokenId))
				.to.be.revertedWithCustomError(contract, "TransferCallerNotOwnerNorApproved")
		})

		it("should be not able to transfer a token if does not exists", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const forbiddenAccount = accounts[0]

			const tokenId = 1

			await expect(contract.transferFrom(owner.address, forbiddenAccount.address, tokenId))
				.to.be.revertedWithCustomError(contract, "OwnerQueryForNonexistentToken")
		})

		it("should emit a transfer event", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const recipientAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			expect(await contract.transferFrom(owner.address, recipientAccount.address, tokenId))
				.to.emit(contract, "Transfer")
				.withArgs(owner.address, recipientAccount.address, tokenId)
		})

		it("should be able to do a delegated transfer", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const delegatedAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await contract.approve(delegatedAccount.address, tokenId)
			const approved = await contract.getApproved(tokenId)

			const delegatedAccountInstance = contract.connect(delegatedAccount)
			await delegatedAccountInstance.transferFrom(owner.address, delegatedAccount.address, tokenId)

			const ownerOf = await contract.ownerOf(tokenId)

			expect(ownerOf).to.equal(delegatedAccount.address)
			expect(approved).to.equal(delegatedAccount.address)
		})

		it("should be able to do a delegated transfer when is approved for all", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const delegatedAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await contract.setApprovalForAll(delegatedAccount.address, true)
			const approved = await contract.isApprovedForAll(owner.address, delegatedAccount.address)

			const delegatedAccountInstance = contract.connect(delegatedAccount)
			await delegatedAccountInstance.transferFrom(owner.address, delegatedAccount.address, tokenId)

			const ownerOf = await contract.ownerOf(tokenId)

			expect(ownerOf).to.equal(delegatedAccount.address)
			expect(approved).to.be.true
		})

		it("should be able to clear approvals after the transfer", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const delegatedAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await contract.approve(delegatedAccount.address, tokenId)

			await contract.transferFrom(owner.address, delegatedAccount.address, tokenId)

			const approved = await contract.getApproved(tokenId)

			expect(approved).to.equal(ethers.ZeroAddress)
		})

		it("should emit an approval event", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const delegatedAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await expect(contract.approve(delegatedAccount.address, tokenId))
				.to.emit(contract, "Approval")
				.withArgs(owner.address, delegatedAccount.address, tokenId)
		})

		it("should emit an approval for all event", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const delegatedAccount = accounts[0]

			await contract.mint(1, { value: ethers.parseEther("0.01") })
			const tokenId = 0

			await expect(contract.setApprovalForAll(delegatedAccount.address, true))
				.to.emit(contract, "ApprovalForAll")
				.withArgs(owner.address, delegatedAccount.address, true)
		})
	})

	describe("Withdraw", async () => {
		it("should be able to withdraw", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const ownerBalanceBefore = await ethers.provider.getBalance(owner.address)
			const valueToMint = ethers.parseEther("0.01")

			const mintingActorInstance = contract.connect(accounts[0])
			await mintingActorInstance.mint(1, { value: valueToMint })

			await contract.withdraw()

			const contractBalance = await ethers.provider.getBalance(await contract.getAddress())
			const ownerBalanceAfter = await ethers.provider.getBalance(owner.address)

			expect(contractBalance).to.equal(0)
			expect(ownerBalanceAfter).to.be.closeTo(ownerBalanceBefore + valueToMint, ethers.parseEther("0.01"))
		})

		it("should be not able to withdraw if is not the owner", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture)

			const valueToMint = ethers.parseEther("0.01")

			const mintingActorInstance = contract.connect(accounts[0])
			await mintingActorInstance.mint(1, { value: valueToMint })

			await expect(mintingActorInstance.withdraw())
				.to.be.revertedWith("Insufficient permission")
		})
	})
})