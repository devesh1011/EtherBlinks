// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing on Etherlink Shadownet
 * Anyone can mint tokens for testing purposes
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6; // USDC uses 6 decimals
    }

    /**
     * @notice Mint tokens to any address (for testing only)
     * @param to Address to receive tokens
     * @param amount Amount to mint (with 6 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Convenience function to mint 1000 USDC to caller
     */
    function faucet() external {
        _mint(msg.sender, 1000 * 10 ** 6); // 1000 USDC
    }
}
