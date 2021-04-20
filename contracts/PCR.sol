pragma solidity ^0.8.3;

/**
 * @title PCR
 * @dev The Contract represents the life cycle of a PCR linked to an insured.
 * @author Eduardo Suarez Ojeda
 */
contract PCR {
    /// @notice Represents the PCR data
    struct PCRData {
        bytes32 insuranceId;
        bytes32 result;
        bytes32 id;
        bytes32 insuredId;
        uint256 requestDate;
        uint256 resultDate;
        address insuranceAddress;
    }

    address payable private owner;
    bool private completed;
    bool private deleted;

    PCRData private pcrData;

    event pcrUpdate(bytes32 insuranceId, bytes32 pcrId,bytes32 result, uint256 resultDate, address insuranceAddress);

    modifier notDeleted {
        require(!deleted, "This PCR has been deleted.");
        _;
    }

    /// @notice Initialize the PCR.
    constructor(
        bytes32 _id, 
        bytes32 _insuranceId,
        bytes32 _insuredId,
        uint256 _requestDate,
        address _insuranceAddress
    ) {
        pcrData.insuranceAddress = _insuranceAddress;
        pcrData.requestDate = _requestDate;
        pcrData.insuredId = _insuredId;
        pcrData.insuranceId = _insuranceId;
        pcrData.id = _id;
        owner = payable(msg.sender);
        completed = false;
        pcrData.result = "UNDEFINED";
        deleted = false;
    }

    /// @notice Update de pcr result state from the laboratory.
    function updatePCR(bytes32 _result, uint256 _resultDate, bytes32 _insuranceId, bytes32 _pcrId) external notDeleted 
    {
        require(!completed, "PCRs can only Update once");
        require(_insuranceId == pcrData.insuranceId && _pcrId == pcrData.id, "Insurance and PCR ids have to be the same as the ones in this contract");
        completed = true;
        pcrData.result = _result;
        pcrData.resultDate = _resultDate;
        emit pcrUpdate(pcrData.insuranceId, pcrData.id, pcrData.result, pcrData.resultDate, pcrData.insuranceAddress);
    }

    /// @notice Returns PCR data.
    function getPCRData() external view returns(
        bytes32 result, 
        bytes32 customerId, 
        uint256 requestDate, 
        uint256 resultDate, 
        bytes32 id,
        address pcrContractAddress,
        bytes32 insuranceId
    ) {
        return (pcrData.result, pcrData.insuredId, pcrData.requestDate, pcrData.resultDate, pcrData.id, address(this),pcrData.insuranceId);
    }

    /// @notice Returns only the PCR id.
    function getId() external view notDeleted returns(bytes32 id) {
        return pcrData.id;
    }

    /// @notice Delete the actual PCR.
    /// @dev Makes every method inaccessible except the one that returns the data.
    function deletePCR() notDeleted external {
        deleted = true;
        delete pcrData;
    }

    /// @notice Delete the contract of the blockchain.
    /// @dev Only use in extreme situations.
    function destructContract() external {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}
