// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "erc721a/contracts/ERC721A.sol";

contract Catto is ERC721A {
    uint private _tokenIdCounter;
    address payable private _owner;

    constructor() ERC721A("Catto", "CTT") {
        _owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Insufficient permission");
        _;
    }

    function burn(uint256 tokenId) external {
        super._burn(tokenId);
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = _owner.call{value: amount}("");
        require(success == true, "Failed to withdraw");
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721A) returns (string memory) {
        return string.concat(super.tokenURI(tokenId), ".json");
    }

    function mint(uint256 quantity) public payable {
        require(msg.value >= 0.01 ether * quantity, "Insufficient payment");
        _mint(msg.sender, quantity);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://catto.xyz/";
    }
}
