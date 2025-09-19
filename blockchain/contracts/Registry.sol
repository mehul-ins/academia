// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Registry {
    struct Certificate {
        string name;
        string rollNumber;
        string course;
        string cgpa;
        uint16 issuedYear;
    }

    mapping(bytes32 => Certificate) private certificates;

    // Add one certificate
    function registerCertificate(
        string calldata name,
        string calldata rollNumber,
        string calldata course,
        string calldata cgpa,
        uint16 issuedYear
    ) external {
        bytes32 key = keccak256(abi.encodePacked(rollNumber));
        certificates[key] = Certificate(name, rollNumber, course, cgpa, issuedYear);
    }

    // Batch add (for CSV upload)
    function registerCertificatesBatch(
        string[] calldata names,
        string[] calldata rollNumbers,
        string[] calldata courses,
        string[] calldata cgpas,
        uint16[] calldata issuedYears
    ) external {
        require(
            names.length == rollNumbers.length &&
            names.length == courses.length &&
            names.length == cgpas.length &&
            names.length == issuedYears.length,
            "Array lengths mismatch"
        );

        for (uint i = 0; i < names.length; i++) {
            bytes32 key = keccak256(abi.encodePacked(rollNumbers[i]));
            certificates[key] = Certificate(names[i], rollNumbers[i], courses[i], cgpas[i], issuedYears[i]);
        }
    }

    // Fetch stored certificate by rollNumber
    function getCertificate(string calldata rollNumber)
        external
        view
        returns (Certificate memory)
    {
        bytes32 key = keccak256(abi.encodePacked(rollNumber));
        return certificates[key];
    }

    // Verify certificate (OCR CSV values vs blockchain values)
    function verifyCertificate(
        string calldata rollNumber,
        string calldata name,
        string calldata course,
        string calldata cgpa,
        uint16 issuedYear
    ) external view returns (bool) {
        bytes32 key = keccak256(abi.encodePacked(rollNumber));
        Certificate memory cert = certificates[key];
        return (
            keccak256(bytes(cert.name)) == keccak256(bytes(name)) &&
            keccak256(bytes(cert.rollNumber)) == keccak256(bytes(rollNumber)) &&
            keccak256(bytes(cert.course)) == keccak256(bytes(course)) &&
            keccak256(bytes(cert.cgpa)) == keccak256(bytes(cgpa)) &&
            cert.issuedYear == issuedYear
        );
    }
}
