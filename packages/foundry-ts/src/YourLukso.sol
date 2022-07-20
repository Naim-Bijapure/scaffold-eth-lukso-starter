import "@lukso/lsp-smart-contracts/contracts/LSP0ERC725Account/LSP0ERC725Account.sol";

contract YourLukso is LSP0ERC725Account {
  // constructor(address _newOwner) LSP0ERC725Account(_newOwner) {}
  constructor(address _newOwner) LSP0ERC725Account(_newOwner) {}

  string purpose = "default purpose";

  function setPurpose(string memory _purpose) public {
    purpose = _purpose;
  }
}
