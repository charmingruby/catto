// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CattoModule = buildModule("CattoModule", (m) => {
	const catto = m.contract("Catto");

	return { catto };
});

export default CattoModule;
