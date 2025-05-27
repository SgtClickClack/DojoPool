// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract DojoCoin is ERC20, AccessControl, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Dojo Coin", "DOJO") {
        // Grant roles to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender); // Grant minter role to deployer initially

        // TODO: Decide on initial supply and mint to a specific address (e.g., deployer or a treasury)
        // For now, no initial supply is minted by default ERC20 constructor
        // _mint(msg.sender, 1000000 * (10 ** decimals())); // Example: Mint initial supply to deployer
    }

    // Function to mint new tokens, restricted to accounts with the MINTER_ROLE
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // ERC20Burnable provides the burn function

    // The following functions are overrides required by AccessControl.
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(AccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    // TODO: Add any specific DojoPool token functionalities here (e.g., burning, specific access control for minting)
} 