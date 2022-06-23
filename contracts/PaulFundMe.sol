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
    address[] public funders;
    mapping(address => uint256) public mapAddressToAmountFunded;
    address public immutable i_owner;
    AggregatorV3Interface public priceFeed;

    //Modifiers
    modifier onlyi_Owner() {
        if (msg.sender != i_owner) {
            revert PaulFundMe__NotOwner();
        }
        _;
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        require(
            msg.value.getConversion(priceFeed) >= MINIMUM_USD,
            "Didn't send enough"
        );
        funders.push(msg.sender);
        mapAddressToAmountFunded[msg.sender] += msg.value;
    }

    function Withdraw() public onlyi_Owner {
        for (uint256 funderIndex; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            mapAddressToAmountFunded[funder] = 0;
        }
        //-------------Reseting the array----------------
        funders = new address[](0);

        //----------------Withdrawing funds------------------
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callSuccess) {
            revert PaulFundMe__CallFailed();
        }
    }
}
