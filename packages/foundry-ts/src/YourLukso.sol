pragma solidity >=0.8.0 <0.9.0;

//SPDX-License-Identifier: MIT

// import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";

// contract YourLukso is LSP0ERC725Account {
contract YourLukso {
  // constructor(address _newOwner) LSP0ERC725Account(_newOwner) {}

  constructor() {}

  string public purpose = "default purpose";

  function setPurpose(string memory _purpose) public {
    purpose = _purpose;
  }
}
