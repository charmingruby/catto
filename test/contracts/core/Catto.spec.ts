import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Catto", () => {
	async function deployFixture() {
		const [owner, accounts] = await hre.ethers.getSigners();

		const Catto = await hre.ethers.getContractFactory("Catto");
		const catto = await Catto.deploy();

		return { contract: catto, owner, accounts };
	}

	it("should return Hello World", async () => {
		const { contract } = await loadFixture(deployFixture);

		expect(await contract.helloWorld()).to.equal("Hello World");
	});
});
