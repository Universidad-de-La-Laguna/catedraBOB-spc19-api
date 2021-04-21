pragma solidity ^0.8.3;

import "./Insurance.sol";

/**
 * @title Spcr19
 * @dev The Contract that controls all the Insurances created in the node and groups them by hotel.
 * @author Eduardo Suarez Ojeda
 */
contract Spc19 {
    address payable private owner;
    mapping(bytes32 => uint256) private InsuranceLocation;
    mapping(bytes32 => Insurance[]) private hotelInsurances;
    mapping(bytes32 => bool) private hotelHasInsurances;
    mapping(bytes32 => bytes32) private idInsuranceToHotel;
    mapping(bytes32 => address) private idInsuranceToAddress;
    bytes32[] private hotels;

    constructor() {
        owner = payable(msg.sender);
    }

    /// @notice Concatenate two array of bytes using the assembly of solidity.
    /// @dev Returns the array result of the concatenation.
    function MergeBytes(bytes memory a, bytes memory b) public pure returns (bytes memory c) {
        // Store the length of the first array
        uint alen = a.length;
        // Store the length of BOTH arrays
        uint totallen = alen + b.length;
        // Count the loops required for array a (sets of 32 bytes)
        uint loopsa = (a.length + 31) / 32;
        // Count the loops required for array b (sets of 32 bytes)
        uint loopsb = (b.length + 31) / 32;
        assembly {
            let m := mload(0x40)
            // Load the length of both arrays to the head of the new bytes array
            mstore(m, totallen)
            // Add the contents of a to the array
            for {  let i := 0 } lt(i, loopsa) { i := add(1, i) } { mstore(add(m, mul(32, add(1, i))), mload(add(a, mul(32, add(1, i))))) }
            // Add the contents of b to the array
            for {  let i := 0 } lt(i, loopsb) { i := add(1, i) } { mstore(add(m, add(mul(32, add(1, i)), alen)), mload(add(b, mul(32, add(1, i))))) }
            mstore(0x40, add(m, add(32, totallen)))
            c := m
        }
    }

    /// @notice Adds a new insurance to the hotel which is the taker of it.
    /// @dev Modify the mappings that link hotels and insurances.
    function addInsurance(Insurance _newInsurance) external {
        _newInsurance.addSpcAddress(address(this));
        require(idInsuranceToHotel[_newInsurance.getId()] == 0, "Insurance ID has already been registered");
        if (!hotelHasInsurances[_newInsurance.getTakerId()]) {
            hotels.push(_newInsurance.getTakerId());
            hotelHasInsurances[_newInsurance.getTakerId()] = true;
        }
        hotelInsurances[_newInsurance.getTakerId()].push(_newInsurance);
        InsuranceLocation[_newInsurance.getId()] = hotelInsurances[_newInsurance.getTakerId()].length - 1;
        idInsuranceToHotel[_newInsurance.getId()] = _newInsurance.getTakerId();
        idInsuranceToAddress[_newInsurance.getId()] = address(_newInsurance);
    }

    /// @notice Get the information of all the insurances that an hotel have had.
    /// @dev Returns a serialized array of bytes with the content of all insurances.
    function getHotelInsurancesData(bytes32 _hotelId) public view returns(
        bytes memory _insurances
    ) {
        bytes memory insuranceData;
        for (uint i = 0; i < hotelInsurances[_hotelId].length; i++) {
            (insuranceData,) = hotelInsurances[_hotelId][i].serializeInsurance();
            _insurances = MergeBytes(_insurances, insuranceData);
        }
    }

    /// @notice Get the information of the insurance selected by argument.
    function getInsuranceData(bytes32 _InsuranceId) public view returns(
        bytes memory _insuranceData,
        uint256 _size
    ) {
        require(idInsuranceToHotel[_InsuranceId] != 0);
        return hotelInsurances[idInsuranceToHotel[_InsuranceId]][InsuranceLocation[_InsuranceId]].serializeInsurance();
    }

    /// @notice Returns all hotel ids which have at least 1 insurance in this contract.
    function getAllHotelsIds() public view returns(bytes32[] memory _hotels) {
        _hotels = hotels;
    }

    /// @notice Get the information of all the insurances that the Contract have had.
    /// @dev Returns a serialized array of bytes with the content of all insurances.
    function getAllInsurances() external view returns(bytes memory _insurancesData) {
        for (uint i = 0; i < hotels.length; i++) {
            _insurancesData = MergeBytes(_insurancesData, getHotelInsurancesData(hotels[i]));
        }
    }

    /// @notice Return the address of the specific insurance.
    /// @dev Useful to call insurance method in that address if needed.
    function getAddressOfInsurance(bytes32 _insuranceId) external view returns(address insuranceAddress) {
        require(idInsuranceToAddress[_insuranceId] != address(0), "No existe una poliza con esa id.");
        return idInsuranceToAddress[_insuranceId];
    }

    /// @notice Delete the contract of the blockchain.
    /// @dev Only use in extreme situations.
    function destructContract() external {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}