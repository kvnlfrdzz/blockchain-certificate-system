// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertChain {
    address public owner;

    struct Certificate {
        uint256 id;
        address recipient;
        string recipientName;
        string eventName;
        string category;
        uint256 issuedAt;
        bool exists;
    }

    uint256 private _nextId;
    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) private _walletCerts;

    event CertificateIssued(
        uint256 indexed id,
        address indexed recipient,
        string recipientName,
        string eventName,
        string category,
        uint256 issuedAt
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
        _nextId = 1;
    }

    function issueCertificate(
        address _recipient,
        string calldata _recipientName,
        string calldata _eventName,
        string calldata _category
    ) external onlyOwner returns (uint256) {
        uint256 certId = _nextId;
        _nextId++;

        certificates[certId] = Certificate({
            id: certId,
            recipient: _recipient,
            recipientName: _recipientName,
            eventName: _eventName,
            category: _category,
            issuedAt: block.timestamp,
            exists: true
        });

        _walletCerts[_recipient].push(certId);

        emit CertificateIssued(
            certId,
            _recipient,
            _recipientName,
            _eventName,
            _category,
            block.timestamp
        );

        return certId;
    }

    function getCertificate(uint256 _id)
        external
        view
        returns (
            uint256 id,
            address recipient,
            string memory recipientName,
            string memory eventName,
            string memory category,
            uint256 issuedAt,
            bool exists
        )
    {
        Certificate storage cert = certificates[_id];
        return (
            cert.id,
            cert.recipient,
            cert.recipientName,
            cert.eventName,
            cert.category,
            cert.issuedAt,
            cert.exists
        );
    }

    function getWalletCertificates(address _wallet)
        external
        view
        returns (uint256[] memory)
    {
        return _walletCerts[_wallet];
    }

    function getTotalCertificates() external view returns (uint256) {
        return _nextId - 1;
    }
}
