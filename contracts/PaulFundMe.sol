//SPDX-License-Identifier: MIT
//Pragma
pragma solidity ^0.8.0;
//Imports
import "./PaulPriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error PaulFundMe__NotOwner();
error PaulFundMe__CallFailed();

contract PaulFundMe {
    //Type Declarations
    using PaulPriceConverter for uint256;
    // State Variables
    uint256 public MINIMUM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_mapAddressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    //Modifiers
    modifier onlyi_Owner() {
        if (msg.sender != i_owner) {
            revert PaulFundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversion(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        );

        s_mapAddressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyi_Owner {
        for (
            uint256 funderIndex;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_mapAddressToAmountFunded[funder] = 0;
        }
        //-------------Reseting the array----------------
        s_funders = new address[](0);

        //----------------Withdrawing funds------------------
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callSuccess) {
            revert PaulFundMe__CallFailed();
        }
    }

    function cheaperWithdraw() public payable onlyi_Owner {
        address[] memory funders = s_funders;
        //mapping can't be in memeory

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_mapAddressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getMapAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_mapAddressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
