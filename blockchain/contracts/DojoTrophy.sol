// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DojoTrophy
 * @dev ERC-721 NFT contract for DojoPool trophies and achievements
 * 
 * Features:
 * - Territory ownership trophies
 * - Tournament winner trophies
 * - Achievement-based trophies
 * - Metadata storage with IPFS support
 * - Role-based access control
 * - Pausable for emergency situations
 * - Reentrancy protection
 */
contract DojoTrophy is ERC721, ERC721URIStorage, AccessControl, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant METADATA_ROLE = keccak256("METADATA_ROLE");

    // Trophy types
    enum TrophyType {
        TERRITORY_OWNERSHIP,    // 0 - For controlling a territory
        TOURNAMENT_WINNER,      // 1 - For winning tournaments
        ACHIEVEMENT,            // 2 - For specific achievements
        CLAN_LEADERSHIP,        // 3 - For clan leadership
        SPECIAL_EVENT,          // 4 - For special events
        LEGENDARY               // 5 - For legendary achievements
    }

    // Trophy rarity levels
    enum Rarity {
        COMMON,     // 0
        UNCOMMON,   // 1
        RARE,       // 2
        EPIC,       // 3
        LEGENDARY,  // 4
        MYTHIC      // 5
    }

    // Trophy struct
    struct Trophy {
        uint256 id;
        TrophyType trophyType;
        Rarity rarity;
        string name;
        string description;
        string imageURI;
        uint256 mintedAt;
        address mintedBy;
        bool isTransferable;
        uint256 territoryId; // For territory trophies
        string achievementId; // For achievement trophies
    }

    // State variables
    Counters.Counter private _tokenIds;
    mapping(uint256 => Trophy) public trophies;
    mapping(address => uint256[]) public userTrophies;
    mapping(TrophyType => uint256) public trophyTypeCounts;
    mapping(Rarity => uint256) public rarityCounts;
    
    // Territory tracking
    mapping(uint256 => bool) public territoryHasTrophy; // territoryId => hasTrophy
    mapping(string => bool) public achievementMinted; // achievementId => isMinted

    // Events
    event TrophyMinted(
        uint256 indexed tokenId,
        address indexed to,
        TrophyType trophyType,
        Rarity rarity,
        string name,
        uint256 territoryId,
        string achievementId
    );

    event TrophyBurned(uint256 indexed tokenId, address indexed from);
    event TrophyMetadataUpdated(uint256 indexed tokenId, string newURI);
    event TrophyTransferabilityUpdated(uint256 indexed tokenId, bool isTransferable);

    // Modifiers
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "DojoTrophy: caller is not a minter");
        _;
    }

    modifier onlyBurner() {
        require(hasRole(BURNER_ROLE, msg.sender), "DojoTrophy: caller is not a burner");
        _;
    }

    modifier onlyMetadataManager() {
        require(hasRole(METADATA_ROLE, msg.sender), "DojoTrophy: caller is not a metadata manager");
        _;
    }

    modifier trophyExists(uint256 tokenId) {
        require(_exists(tokenId), "DojoTrophy: trophy does not exist");
        _;
    }

    /**
     * @dev Constructor
     * @param name_ Name of the NFT collection
     * @param symbol_ Symbol of the NFT collection
     */
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(METADATA_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new trophy
     * @param to Address to mint the trophy to
     * @param trophyType Type of trophy
     * @param rarity Rarity level
     * @param name Name of the trophy
     * @param description Description of the trophy
     * @param imageURI IPFS URI for the trophy image
     * @param isTransferable Whether the trophy can be transferred
     * @param territoryId Territory ID (for territory trophies)
     * @param achievementId Achievement ID (for achievement trophies)
     * @return tokenId The ID of the minted trophy
     */
    function mintTrophy(
        address to,
        TrophyType trophyType,
        Rarity rarity,
        string memory name,
        string memory description,
        string memory imageURI,
        bool isTransferable,
        uint256 territoryId,
        string memory achievementId
    ) external onlyMinter whenNotPaused nonReentrant returns (uint256) {
        require(to != address(0), "DojoTrophy: cannot mint to zero address");
        require(bytes(name).length > 0, "DojoTrophy: name cannot be empty");

        // Check for duplicate territory trophies
        if (trophyType == TrophyType.TERRITORY_OWNERSHIP) {
            require(!territoryHasTrophy[territoryId], "DojoTrophy: territory already has a trophy");
            territoryHasTrophy[territoryId] = true;
        }

        // Check for duplicate achievement trophies
        if (trophyType == TrophyType.ACHIEVEMENT) {
            require(!achievementMinted[achievementId], "DojoTrophy: achievement already minted");
            achievementMinted[achievementId] = true;
        }

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Create trophy struct
        Trophy memory newTrophy = Trophy({
            id: newTokenId,
            trophyType: trophyType,
            rarity: rarity,
            name: name,
            description: description,
            imageURI: imageURI,
            mintedAt: block.timestamp,
            mintedBy: msg.sender,
            isTransferable: isTransferable,
            territoryId: territoryId,
            achievementId: achievementId
        });

        trophies[newTokenId] = newTrophy;
        userTrophies[to].push(newTokenId);
        trophyTypeCounts[trophyType]++;
        rarityCounts[rarity]++;

        // Mint the NFT
        _safeMint(to, newTokenId);

        emit TrophyMinted(
            newTokenId,
            to,
            trophyType,
            rarity,
            name,
            territoryId,
            achievementId
        );

        return newTokenId;
    }

    /**
     * @dev Mint a territory ownership trophy
     * @param to Address to mint the trophy to
     * @param territoryId Territory ID
     * @param territoryName Name of the territory
     * @param rarity Rarity level (based on territory value)
     * @return tokenId The ID of the minted trophy
     */
    function mintTerritoryTrophy(
        address to,
        uint256 territoryId,
        string memory territoryName,
        Rarity rarity
    ) external onlyMinter whenNotPaused returns (uint256) {
        require(!territoryHasTrophy[territoryId], "DojoTrophy: territory already has a trophy");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        string memory name = string(abi.encodePacked("Territory Master: ", territoryName));
        
        trophies[newTokenId] = Trophy({
            id: newTokenId,
            trophyType: TrophyType.TERRITORY_OWNERSHIP,
            rarity: rarity,
            name: name,
            description: "Awarded for controlling territory",
            mintedAt: block.timestamp,
            mintedBy: msg.sender,
            isTransferable: true,
            territoryId: territoryId,
            achievementId: ""
        });

        territoryHasTrophy[territoryId] = true;
        userTrophies[to].push(newTokenId);
        _safeMint(to, newTokenId);

        emit TrophyMinted(newTokenId, to, TrophyType.TERRITORY_OWNERSHIP, rarity, name, territoryId, "");
        return newTokenId;
    }

    /**
     * @dev Mint a tournament winner trophy
     * @param to Address to mint the trophy to
     * @param tournamentName Name of the tournament
     * @param tournamentId Tournament ID
     * @param rarity Rarity level (based on tournament size/importance)
     * @return tokenId The ID of the minted trophy
     */
    function mintTournamentTrophy(
        address to,
        string memory tournamentName,
        string memory tournamentId,
        Rarity rarity
    ) external onlyMinter whenNotPaused returns (uint256) {
        string memory name = string(abi.encodePacked("Tournament Champion: ", tournamentName));
        string memory description = string(abi.encodePacked(
            "Awarded for winning the ", tournamentName, " tournament. ",
            "This trophy represents excellence and competitive spirit in the DojoPool arena."
        ));
        
        return mintTrophy(
            to,
            TrophyType.TOURNAMENT_WINNER,
            rarity,
            name,
            description,
            "", // imageURI will be set later
            true, // Tournament trophies are transferable
            0, // No territory ID for tournament trophies
            tournamentId
        );
    }

    /**
     * @dev Mint an achievement trophy
     * @param to Address to mint the trophy to
     * @param achievementId Achievement ID
     * @param achievementName Name of the achievement
     * @param rarity Rarity level
     * @return tokenId The ID of the minted trophy
     */
    function mintAchievementTrophy(
        address to,
        string memory achievementId,
        string memory achievementName,
        Rarity rarity
    ) external onlyMinter whenNotPaused returns (uint256) {
        string memory name = string(abi.encodePacked("Achievement: ", achievementName));
        string memory description = string(abi.encodePacked(
            "Awarded for completing the achievement: ", achievementName, 
            ". This trophy represents dedication and skill in the DojoPool world."
        ));
        
        return mintTrophy(
            to,
            TrophyType.ACHIEVEMENT,
            rarity,
            name,
            description,
            "", // imageURI will be set later
            false, // Achievement trophies are not transferable
            0, // No territory ID for achievement trophies
            achievementId
        );
    }

    /**
     * @dev Burn a trophy (only by authorized burners)
     * @param tokenId ID of the trophy to burn
     */
    function burnTrophy(uint256 tokenId) external onlyBurner trophyExists(tokenId) {
        address owner = ownerOf(tokenId);
        
        // Remove from user trophies
        uint256[] storage userTrophyList = userTrophies[owner];
        for (uint256 i = 0; i < userTrophyList.length; i++) {
            if (userTrophyList[i] == tokenId) {
                userTrophyList[i] = userTrophyList[userTrophyList.length - 1];
                userTrophyList.pop();
                break;
            }
        }

        // Update counters
        Trophy memory trophy = trophies[tokenId];
        trophyTypeCounts[trophy.trophyType]--;
        rarityCounts[trophy.rarity]--;

        // Clear territory/achievement tracking
        if (trophy.trophyType == TrophyType.TERRITORY_OWNERSHIP) {
            territoryHasTrophy[trophy.territoryId] = false;
        } else if (trophy.trophyType == TrophyType.ACHIEVEMENT) {
            achievementMinted[trophy.achievementId] = false;
        }

        // Delete trophy data
        delete trophies[tokenId];

        // Burn the NFT
        _burn(tokenId);

        emit TrophyBurned(tokenId, owner);
    }

    /**
     * @dev Update trophy metadata URI
     * @param tokenId ID of the trophy
     * @param newURI New metadata URI
     */
    function updateTrophyURI(uint256 tokenId, string memory newURI) 
        external onlyMetadataManager trophyExists(tokenId) {
        _setTokenURI(tokenId, newURI);
        emit TrophyMetadataUpdated(tokenId, newURI);
    }

    /**
     * @dev Update trophy image URI
     * @param tokenId ID of the trophy
     * @param newImageURI New image URI
     */
    function updateTrophyImageURI(uint256 tokenId, string memory newImageURI) 
        external onlyMetadataManager trophyExists(tokenId) {
        trophies[tokenId].imageURI = newImageURI;
        emit TrophyMetadataUpdated(tokenId, newImageURI);
    }

    /**
     * @dev Update trophy transferability
     * @param tokenId ID of the trophy
     * @param isTransferable New transferability status
     */
    function updateTrophyTransferability(uint256 tokenId, bool isTransferable) 
        external onlyMetadataManager trophyExists(tokenId) {
        trophies[tokenId].isTransferable = isTransferable;
        emit TrophyTransferabilityUpdated(tokenId, isTransferable);
    }

    /**
     * @dev Get trophy details
     * @param tokenId ID of the trophy
     * @return Trophy struct
     */
    function getTrophy(uint256 tokenId) external view trophyExists(tokenId) returns (Trophy memory) {
        return trophies[tokenId];
    }

    /**
     * @dev Get user's trophies
     * @param user Address of the user
     * @return Array of trophy IDs
     */
    function getUserTrophies(address user) external view returns (uint256[] memory) {
        return userTrophies[user];
    }

    /**
     * @dev Get trophy count by type
     * @param trophyType Type of trophy
     * @return Count of trophies of that type
     */
    function getTrophyTypeCount(TrophyType trophyType) external view returns (uint256) {
        return trophyTypeCounts[trophyType];
    }

    /**
     * @dev Get trophy count by rarity
     * @param rarity Rarity level
     * @return Count of trophies of that rarity
     */
    function getRarityCount(Rarity rarity) external view returns (uint256) {
        return rarityCounts[rarity];
    }

    /**
     * @dev Check if territory has a trophy
     * @param territoryId Territory ID
     * @return True if territory has a trophy
     */
    function hasTerritoryTrophy(uint256 territoryId) external view returns (bool) {
        return territoryHasTrophy[territoryId];
    }

    /**
     * @dev Check if achievement has been minted
     * @param achievementId Achievement ID
     * @return True if achievement has been minted
     */
    function isAchievementMinted(string memory achievementId) external view returns (bool) {
        return achievementMinted[achievementId];
    }

    /**
     * @dev Override transfer function to check transferability
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        
        // Check if trophy is transferable (only for single transfers)
        if (batchSize == 1) {
            require(
                trophies[firstTokenId].isTransferable || from == address(0),
                "DojoTrophy: trophy is not transferable"
            );
        }
    }

    /**
     * @dev Pause contract (emergency only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Required override for AccessControl
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Required override for ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Required override for ERC721URIStorage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
} 