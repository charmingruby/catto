import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Catto", () => {
	async function deployFixture() {
		const [owner, ...accounts] = await hre.ethers.getSigners();

		const Catto = await hre.ethers.getContractFactory("Catto");
		const catto = await Catto.deploy();

		return { contract: catto, owner, accounts };
	}

	describe("Metadata", async () => {
		it("should return the contract name", async () => {
			const { contract } = await loadFixture(deployFixture);

			expect(await contract.name()).to.equal("Catto");
		})

		it("should return the symbol", async () => {
			const { contract } = await loadFixture(deployFixture);

			expect(await contract.symbol()).to.equal("CTT");
		});

		it("should be able to get the URI metadata", async () => {
			const { contract } = await loadFixture(deployFixture);

			await contract.mint();
			const tokenId = await contract.tokenByIndex(0);

			expect(await contract.tokenURI(tokenId)).to.equal("https://catto.xyz/1.json");
		})

		it("should be not able to get URI metadata if does not exists", async () => {
			const { contract } = await loadFixture(deployFixture);

			await expect(contract.tokenURI(0)).
				to.be.revertedWithCustomError(contract, "ERC721NonexistentToken");
		})
	});

	describe("Mint", async () => {
		it("should be able to mint", async () => {
			const { contract, owner } = await loadFixture(deployFixture);

			await contract.mint();

			const balance = await contract.balanceOf(owner.address);
			const tokenId = await contract.tokenByIndex(0);
			const ownerOf = await contract.ownerOf(tokenId);
			const ownerTokenId = await contract.tokenOfOwnerByIndex(owner.address, 0);
			const totalSupply = await contract.totalSupply();

			expect(balance).to.equal(1);
			expect(tokenId).to.equal(ownerTokenId);
			expect(ownerOf).to.equal(owner.address);
			expect(totalSupply).to.equal(1);
		})

		it("should be able to burn", async () => {
			const { contract, owner } = await loadFixture(deployFixture);

			await contract.mint();

			const tokenId = await contract.tokenByIndex(0);

			await contract.burn(tokenId);

			const balance = await contract.balanceOf(owner.address);
			const totalSupply = await contract.totalSupply();

			expect(balance).to.equal(0);
			expect(totalSupply).to.equal(0);
		})

		it("should be able to do a delegated burn", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture);

			await contract.mint();
			const tokenId = await contract.tokenByIndex(0);

			const delegatedAccount = accounts[0];
			const delegatedAccountInstance = contract.connect(delegatedAccount);

			await contract.approve(delegatedAccount.address, tokenId);

			await delegatedAccountInstance.burn(tokenId);

			const balance = await contract.balanceOf(owner.address);
			const totalSupply = await contract.totalSupply();

			expect(balance).to.equal(0);
			expect(totalSupply).to.equal(0);
		})

		it("should be able to do burn approved for all", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture);

			await contract.mint();
			const tokenId = await contract.tokenByIndex(0);

			const delegatedAccount = accounts[0];
			const delegatedAccountInstance = contract.connect(delegatedAccount);

			await contract.setApprovalForAll(delegatedAccount.address, true);

			await delegatedAccountInstance.burn(tokenId);

			const balance = await contract.balanceOf(owner.address);
			const totalSupply = await contract.totalSupply();

			expect(balance).to.equal(0);
			expect(totalSupply).to.equal(0);
		})

		it("should be not able to burn if token does not exists", async () => {
			const { contract } = await loadFixture(deployFixture);

			await expect(contract.burn(1))
				.to.be.revertedWithCustomError(contract, "ERC721NonexistentToken");
		})

		it("should be not able to do a delegated burn without permission", async () => {
			const { contract, owner, accounts } = await loadFixture(deployFixture);

			await contract.mint();
			const tokenId = await contract.tokenByIndex(0);

			const delegatedAccount = accounts[0];
			const delegatedAccountInstance = contract.connect(delegatedAccount);

			await expect(delegatedAccountInstance.burn(tokenId)).
				to.be.revertedWithCustomError(contract, "ERC721InsufficientApproval");
		})
	})
});
