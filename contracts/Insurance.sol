pragma solidity ^0.8.3;

import "./PCR.sol";

/**
 * @title Seriality
 * @dev The Seriality contract is the main interface for serializing data using the TypeToBytes, BytesToType and SizeOf
 * @author pouladzade@gmail.com
 */
contract Seriality {

    constructor () { }

    function sizeOfUint8() internal pure returns(uint _size) {
        return 1;
    }

    function sizeOfUint16() internal pure returns(uint _size) {
        return 2;
    }

    function sizeOfUint256() internal pure returns(uint _size) {
        return 32;
    }

    function sizeOfString(string memory _in) internal pure  returns(uint _size){
        _size = bytes(_in).length / 32;
        if (bytes(_in).length % 32 != 0)
            _size++;

        _size++; // first 32 bytes is reserved for the size of the string
        _size *= 32;
    }

    function boolToBytes(uint _offst, bool _input, bytes memory _output) internal pure {
        uint8 x = _input == false ? 0 : 1;
        assembly {
            mstore(add(_output, _offst), x)
        }
    }

    function stringToBytes(uint _offst, bytes memory _input, bytes memory _output) internal pure {
        uint256 stack_size = _input.length / 32;
        if(_input.length % 32 > 0) stack_size++;

        stack_size++;
        for (uint index = 0; index < stack_size; index++) {
            assembly {
                mstore(add(_output, _offst), mload(add(_input,mul(index,32))))
                _offst := sub(_offst , 32)
            }
        }
    }

    function uintToBytes(uint _offst, uint _input, bytes memory _output) internal pure {
        assembly {
            mstore(add(_output, _offst), _input)
        }
    }

    function bytes32ToBytes(uint _offst, bytes32 _input, bytes memory _output) internal pure {

        bytes memory inputBytes = abi.encodePacked(_input);
        // Modified from the source code to work in bytes32
        assembly {
            mstore(add(_output, _offst), mload(add(inputBytes,32)))
        }
    }
}

/**
 * @title Insurance
 * @dev The Insurance Contract which represents the state of an insurance taken out by a hotel.
 * @author Eduardo Suarez Ojeda
 */
contract Insurance is Seriality {
    /// @notice Struct that contains the insurance information.
    struct InsuranceData {
        uint16 dailyCompensation;
        uint16 daysToCompensate;
        uint16 pcrNumber;
        uint16 insuredNumber;
        bytes32 id;
        uint256 insuranceStartDate;
        uint256 insuranceFinishDate;
        uint256 contractDate;
        bytes32[] insureds;
        uint256 sinisterCompensation;
    }
    
    /// @notice Struct that contains the taker information.
    struct TakerData {
        string takerName;
        string takerAddress;
        string takerEmail;
        bytes32 takerId;
        bytes32 takerNif;
        bytes32 takerPostalCode;
        bytes32 takerTown;
        bytes32 takerLocation;
        bytes32 takerTelephone;
        bytes32 takerMobile;
        bytes32 takerIban;
    }

    /// @notice Struct that contains the PCR information.
    struct PcrData {
        bytes32 result;
        bytes32 id;
        bytes32 insuredId;
        uint256 requestDate;
        uint256 resultDate;
        address contractAddress;
    }

    //  Security variables to verify that the contract can only be accessed by the owner or another contract that contains this one.
    address payable private owner;
    address private spcAddress;
    bool private spcAddressAdded;

    //  Mappings for control assignements of pcrs to insureds.
    mapping(bytes32 => uint256) private pcrLocation;
    mapping(bytes32 => bytes32[]) private insuredPCRs;
    mapping(bytes32 => bool) private insuredInInsurance;
    mapping(bytes32 => bool) private isPcrActive;
    mapping(bytes32 => bytes32) private pcrIdToInsuredId;
    mapping(bytes32 => bytes32) private insuredNegPcrHash;
    mapping(bytes32 => uint256) private insuredNegPcrDate;
    mapping(bytes32 => PcrData) private pcrIdToData;
    InsuranceData private insuranceData;
    TakerData private takerData;

    //  Bools to control de Sinister of the insurance.
    bool private positivePcrTest;
    bool private paymentEmitted;
    uint256 private timePaymentEmitted;

    ///  Events to emit the information about a sinister.
    event positivePcr(bytes32 customerId, uint256 resultDate, bytes32 insuranceId);
    event checkPayment(bytes32 hotelId, bytes32 hotelIban);

    /// @notice Fill the information of taker data and insurance data.
    constructor(
        bytes32[] memory _insuredsNegPcrHash,
        uint256[] memory _insuredsNegPcrDate,
        bytes32[] memory _ids, 
        bytes32[] memory _insureds, 
        uint256[] memory _insuranceStartFinishDate, 
        uint16[] memory _dailyCompensationAndDuration, 
        bytes32[] memory _takerData,
        string memory _takerName,
        string memory _takerAddress,
        string memory _takerEmail
    ) {

        owner = payable(msg.sender);
        spcAddressAdded = false;
        takerData.takerEmail = _takerEmail;
        takerData.takerAddress = _takerAddress;
        takerData.takerName = _takerName;
        takerData.takerNif = _takerData[0];
        takerData.takerPostalCode = _takerData[1];
        takerData.takerTown = _takerData[2];
        takerData.takerLocation = _takerData[3];
        takerData.takerTelephone = _takerData[4];
        takerData.takerMobile = _takerData[5];
        takerData.takerIban = _takerData[6];
        require(_dailyCompensationAndDuration.length == 2, "You have to provide the amount of day compensation and the number of days.");
        insuranceData.dailyCompensation = _dailyCompensationAndDuration[0];
        insuranceData.daysToCompensate = _dailyCompensationAndDuration[1];
        require(_insuranceStartFinishDate.length == 3, "The Policy need a start date, a finish date and a contract date.");
        require(_insuranceStartFinishDate[0] < _insuranceStartFinishDate[1], "The start date has to be before the finish date.");
        insuranceData.insuranceStartDate = _insuranceStartFinishDate[0]; 
        insuranceData.insuranceFinishDate = _insuranceStartFinishDate[1];
        insuranceData.contractDate = _insuranceStartFinishDate[2];
        insuranceData.insureds = _insureds;

        require(_ids.length == 2, "Must provide Policy ID and Taker ID.");
        takerData.takerId = _ids[1];
        insuranceData.id = _ids[0];

        require(_insuredsNegPcrDate.length == _insureds.length);
        require(_insuredsNegPcrHash.length == _insureds.length);
        // add insureds
        for (uint i=0; i < _insureds.length; i++) {
            insuredInInsurance[_insureds[i]] = true;
            require(_insuredsNegPcrDate[i] >= (block.timestamp - 259200), "Check that previous PCR has been no more than 3 days ago.");
            insuredNegPcrDate[_insureds[i]] = _insuredsNegPcrDate[i];
            insuredNegPcrHash[_insureds[i]] = (_insuredsNegPcrHash[i]);
        }
        insuranceData.insuredNumber = uint8(insuranceData.insureds.length);
        insuranceData.pcrNumber = 0;
        insuranceData.sinisterCompensation = insuranceData.dailyCompensation * insuranceData.daysToCompensate * insuranceData.insuredNumber;
    }

    /// @notice Fires when the contract get a positive PCR.
    /// @dev Emit the sinister event.
    function compensation() public {
        if (positivePcrTest && !paymentEmitted) {
            emit checkPayment(takerData.takerId, insuranceData.id);
            paymentEmitted = true;
            timePaymentEmitted = block.timestamp;
        }
    }

    /// @notice Add new PCR to an insured.
    /// @dev Update the PCR mappings.
    function addPCRtoInsured(
        bytes32 _insuredId,
        bytes32 _idPcr,
        uint256 _requestDate,
        address _contractAddress
        ) public {
        require(insuredInInsurance[_insuredId], "The id of the insured is not in the policy.");
        require(!isPcrActive[_idPcr], "Ya existe una PCR con ese ID");
        insuredPCRs[_insuredId].push(_idPcr);
        pcrLocation[_idPcr] = insuredPCRs[_insuredId].length;
        pcrIdToInsuredId[_idPcr] = _insuredId;
        pcrIdToData[_idPcr] = PcrData({
            result: "UNDEFINED",
            id: _idPcr, 
            insuredId: _insuredId,
            requestDate: _requestDate,
            resultDate: 0,
            contractAddress: _contractAddress
        });
        isPcrActive[_idPcr] = true;
        insuranceData.pcrNumber++;
    }

    /// @notice Update the result of a pending PCR that a insured had already registered.
    /// @dev Update the PCR selected and fires Sinister event if the result is positive.
    function updatePCR(bytes32 _idPCR, bytes32 _resultPCR) public {
        // require(pcrIdToInsuredId[_idPCR] != 0, "PCR has to be linked to an insured identifier.");
        bytes32 posPCR = "POSITIVE";
        bytes32 insuredId = pcrIdToInsuredId[_idPCR];
        require(isPcrActive[_idPCR], "La PCR tiene que existir");
        pcrIdToData[_idPCR].result = _resultPCR;
        pcrIdToData[_idPCR].resultDate = block.timestamp;
        if (_resultPCR == posPCR) {
            positivePcrTest = true;
            emit positivePcr(insuredId, block.timestamp, insuranceData.id);
            if (block.timestamp < insuranceData.insuranceFinishDate) {
                compensation();
            }
        }
    }

    /// @notice Deletes a pcr already requested by an insured.
    /// @dev Updates the state of the PCR selected.
    function deletePCR(bytes32 _idPCR) public returns(address _pcrContractAddress) {
        // require(pcrIdToInsuredId[_idPCR] != 0, "PCR has to be linked to an insured identifier.");
        require(isPcrActive[_idPCR], "No existe una PCR con esa ID");
        address contractAddress = pcrIdToData[_idPCR].contractAddress;
        isPcrActive[_idPCR] = false;
        insuranceData.pcrNumber--;
        return contractAddress;
    }

    /// @notice Returns the information of a PCR.
    function getPCR(bytes32 _idPCR) public view returns(
        bytes32 result, 
        bytes32 customerId, 
        uint256 requestDate,
        uint256 resultDate, 
        bytes32 id,
        address pcrContractAddress
    ) {
        require(isPcrActive[_idPCR], "No existe una PCR con esa ID");
        return (
            pcrIdToData[_idPCR].result,
            pcrIdToData[_idPCR].insuredId,
            pcrIdToData[_idPCR].requestDate,
            pcrIdToData[_idPCR].resultDate,
            pcrIdToData[_idPCR].id,
            pcrIdToData[_idPCR].contractAddress
            );
    }

    /// @notice Returns the information of the taker data.
    function getTakerData() external view returns(
        bytes32 takerId, 
        bytes32 takerNif, 
        string memory takerFullName,
        string memory takerContactAddress, 
        bytes32 takerContactPostalCode,
        bytes32 takerContactTown, 
        bytes32 takerContactLocation,
        bytes32 takerContactTelephone, 
        bytes32 takerContactMobile,
        string memory takerContactEmail, 
        bytes32 takerIBAN
    ) {
        return (
        takerData.takerId,
        takerData.takerNif,
        takerData.takerName,
        takerData.takerAddress,
        takerData.takerPostalCode,
        takerData.takerTown,
        takerData.takerLocation,
        takerData.takerTelephone,
        takerData.takerMobile,
        takerData.takerEmail,
        takerData.takerIban);
    }

    /// @notice Returns the information of the insurance data.
    function getInsuranceData() external view returns(
        bytes32 idPolicy, 
        uint16 dailyCompensationPolicy, 
        uint16 daysToCompensatePolicy, 
        uint16 insuredNumberPolicy, 
        uint256 startDatePolicy, 
        uint256 finishDatePolicy,
        bytes32[] memory insureds
    ) {
        return (
        insuranceData.id,
        insuranceData.dailyCompensation,
        insuranceData.daysToCompensate,
        insuranceData.insuredNumber,
        insuranceData.insuranceStartDate,
        insuranceData.insuranceFinishDate,
        insuranceData.insureds);
    }

    /// @notice Modify the address of the general contract. It only can be used 1 time.
    /// @dev Updates the address of the general contract for security reasons.
    function addSpcAddress(address _spcAddress) external {
        require(!spcAddressAdded);
        spcAddressAdded = true;
        spcAddress = _spcAddress;
    }

    /// @notice Convert all the information of the insurance into an array of bytes.
    /// @dev Returns all data of the insurance in an array of bytes.
    function serializeInsurance() external view returns (bytes memory _serializedInsurance, uint256 _size) {
        uint16 nameSize = uint16(sizeOfString(takerData.takerName));
        uint16 addressSize = uint16(sizeOfString(takerData.takerAddress));
        uint16 emailSize = uint16(sizeOfString(takerData.takerEmail));

        uint256 offset = (
            4 + // 2 uint16 
            128 + // 2 uint256 and 1 bytes32 Insurance Info
            (32 * insuranceData.insuredNumber) +  // ids of insureds
            (32 * insuranceData.insuredNumber * 2) + // negative previous PCR hash and date 
            (32 * 9) + //bytes32 of takerData
            nameSize + addressSize + emailSize +
            10 + // uints16 to check string sizes (3) and to check insuredNumber (1) and to check number of PCRs (1)
            2 + // 2 bools
            (32 * 5 * insuranceData.pcrNumber) + // Info about all PCRs of insureds
            30 // Extra size to prevent null return when no PCRs added. Used in pcrNumber
        );
        _serializedInsurance = new bytes(offset);
        _size = offset;

        // Insurance Info
        // serialize Insurance ID
        bytes32ToBytes(offset, insuranceData.id, _serializedInsurance);
        offset -= 32;

        // serialize sinister compensation
        uintToBytes(offset, insuranceData.sinisterCompensation, _serializedInsurance);
        offset -= 32;

        // serialize Insurance Start Date
        uintToBytes(offset, insuranceData.insuranceStartDate, _serializedInsurance);
        offset -= 32;

        // serialize Insurance Finish Date
        uintToBytes(offset, insuranceData.insuranceFinishDate, _serializedInsurance);
        offset -= 32;

        // serialize Contract Date
        uintToBytes(offset, insuranceData.contractDate, _serializedInsurance);
        offset -= 32;

        // serialize Daily Compensation
        uintToBytes(offset, insuranceData.dailyCompensation, _serializedInsurance);
        offset -= 2;

        // serialize Days to Compensate
        uintToBytes(offset, insuranceData.daysToCompensate, _serializedInsurance);
        offset -= 2;

        // Taker Info
        // serialize Taker ID
        bytes32ToBytes(offset, takerData.takerId, _serializedInsurance);
        offset -= 32;

        // serialize Taker NIF
        bytes32ToBytes(offset, takerData.takerNif, _serializedInsurance);
        offset -= 32;

        // serialize Taker Postal Code
        bytes32ToBytes(offset, takerData.takerPostalCode, _serializedInsurance);
        offset -= 32;

        // serialize Taker Town
        bytes32ToBytes(offset, takerData.takerTown, _serializedInsurance);
        offset -= 32;

        // serialize Taker Location
        bytes32ToBytes(offset, takerData.takerLocation, _serializedInsurance);
        offset -= 32;

        // serialize Taker Telephone
        bytes32ToBytes(offset, takerData.takerTelephone, _serializedInsurance);
        offset -= 32;

        // serialize Taker Mobile
        bytes32ToBytes(offset, takerData.takerMobile, _serializedInsurance);
        offset -= 32;

        // serialize Taker IBAN
        bytes32ToBytes(offset, takerData.takerIban, _serializedInsurance);
        offset -= 32;

        // serialize Positive PCR bool
        boolToBytes(offset, positivePcrTest, _serializedInsurance);
        offset -= 1;

        // serialize Payment Emitted Bool
        boolToBytes(offset, paymentEmitted, _serializedInsurance);
        offset -= 1;

        // Start with variable size Data
        // serialize Taker Name size and data
        uintToBytes(offset, nameSize, _serializedInsurance);
        offset -= 2;

        stringToBytes(offset, bytes(takerData.takerName), _serializedInsurance);
        offset -= nameSize;

        // serialize Taker Address size and data
        uintToBytes(offset, addressSize, _serializedInsurance);
        offset -= 2;

        stringToBytes(offset, bytes(takerData.takerAddress), _serializedInsurance);
        offset -= addressSize;

        // serialize Taker Email size and data
        uintToBytes(offset, emailSize, _serializedInsurance);
        offset -= 2;

        stringToBytes(offset, bytes(takerData.takerEmail), _serializedInsurance);
        offset -= emailSize;

        // Insureds Data
        // serialize Number of Insureds
        uintToBytes(offset, insuranceData.insuredNumber, _serializedInsurance);
        offset -= 2;

        // serialize Insureds Informatio
        for (uint256 i = 0; i < insuranceData.insuredNumber; i++) {
            // serialize Insured ID
            bytes32ToBytes(offset, insuranceData.insureds[i], _serializedInsurance);
            offset -= 32;

            // serialize Insured Negative PCR Hash
            bytes32ToBytes(offset, insuredNegPcrHash[insuranceData.insureds[i]], _serializedInsurance);
            offset -= 32;

            // serialize Insured Negative PCR Date
            uintToBytes(offset, insuredNegPcrDate[insuranceData.insureds[i]], _serializedInsurance);
            offset -= 32;
        }

        // serialize PCR Data
        // serialize Number of PCRs
        uintToBytes(offset, insuranceData.pcrNumber, _serializedInsurance);
        offset -= 32;

        bytes32 resultPcr; 
        bytes32 insuredIdPcr; 
        uint256 requestDatePcr; 
        uint256 resultDatePcr;
        bytes32 idPcr;

        // Get all PCR data
        for (uint256 i = 0; i < insuranceData.insuredNumber; i++) {
            for (uint256 j = 0; j < insuredPCRs[insuranceData.insureds[i]].length; j++) {
                if (!isPcrActive[insuredPCRs[insuranceData.insureds[i]][j]]) {
                    continue;
                }
                (resultPcr, insuredIdPcr, requestDatePcr, resultDatePcr, idPcr,) = getPCR(insuredPCRs[insuranceData.insureds[i]][j]);
                // serialize PCR ID
                bytes32ToBytes(offset, idPcr, _serializedInsurance);
                offset -= 32;

                // serialize PCR result Date
                uintToBytes(offset, resultDatePcr, _serializedInsurance);
                offset -= 32;

                // serialize PCR request Date
                uintToBytes(offset, requestDatePcr, _serializedInsurance);
                offset -= 32;

                // serialize Insured ID of PCR
                bytes32ToBytes(offset, insuredIdPcr, _serializedInsurance);
                offset -= 32;

                // serialize result of PCR
                bytes32ToBytes(offset, resultPcr, _serializedInsurance);
                offset -= 32;
            }
        }
    }

    /// @notice Returns only the taker identifier.
    function getTakerId() external view returns(bytes32 takerId) {
        return takerData.takerId;
    }

    /// @notice Returns only the insurance identifier.
    function getId() external view returns(bytes32 insuranceId) {
        return insuranceData.id;
    }

    /// @notice Delete the contract of the blockchain.
    /// @dev Only use in extreme situations.
    function destructContract() external {
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}
