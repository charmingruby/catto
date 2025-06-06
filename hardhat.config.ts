import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000,
			},
		},
	},
	networks: {
		local: {
			url: "http://127.0.0.1:8545",
			chainId: 31337,
			accounts: {
				mnemonic: "test test test test test test test test test test test junk",
			},
		},
		sepolia: {
			url: process.env.INFURA_URL,
			chainId: Number(process.env.CHAIN_ID),
			accounts: {
				mnemonic: process.env.MNEMONIC,
			},
		},
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY,
	},
};

export default config;
