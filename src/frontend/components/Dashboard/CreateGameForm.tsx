import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Autocomplete,
} from "@mui/material";
// import axios from 'axios'; // Removed default axios import
import axiosInstance from "../../api/axiosInstance"; // Import the configured instance
import { useUserProfile } from "../../contexts/UserContext"; // Import useUserProfile
import debounce from "lodash.debounce"; // Import debounce
import * as tournamentApi from '../../api/tournamentApi';

// Define interfaces for API data
interface Venue {
  id: number;
  name: string;
  // Add other relevant venue properties if needed
}

interface Table {
  id: number;
  name: string; // Or maybe just use the ID as the name?
  status: string; // e.g., 'available', 'occupied'
  // Add other relevant table properties if needed
}

// Define User Search Result type
interface UserSearchResult {
  id: number;
  username: string;
  // Add email if needed/returned by search API
}

const CreateGameForm = () => {
  // const { user } = useAuth(); // Replaced with useUserProfile
  const {
    profile: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile(); // Get user profile context
  const [gameType, setGameType] = useState("");
  const [opponentId, setOpponentId] = useState<number | null>(null); // Store selected opponent ID
  const [opponentSearch, setOpponentSearch] = useState(""); // Store search input
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingOpponent, setIsSearchingOpponent] = useState(false);
  const [venueId, setVenueId] = useState<string | number>(""); // Allow number type
  const [tableId, setTableId] = useState<string | number>(""); // Renamed from tableNumber, allow number

  // State for fetched data
  const [venues, setVenues] = useState<Venue[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  // Loading/Error states for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Loading/Error states for data fetching
  const [isFetchingVenues, setIsFetchingVenues] = useState(false);
  const [fetchVenuesError, setFetchVenuesError] = useState<string | null>(null);
  const [isFetchingTables, setIsFetchingTables] = useState(false);
  const [fetchTablesError, setFetchTablesError] = useState<string | null>(null);

  // Add tournament creation form state
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState('single_elimination');
  const [tournamentGameType, setTournamentGameType] = useState('eight_ball');
  const [format, setFormat] = useState('bracket');
  const [tournamentError, setTournamentError] = useState<string | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);

  // Debounced function to search for users
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        // Only search if query is long enough
        setSearchResults([]);
        setIsSearchingOpponent(false);
        return;
      }
      setIsSearchingOpponent(true);
      try {
        // Assuming the endpoint returns paginated data: { results: UserSearchResult[] }
        // Adjust based on actual API response structure
        const response = await axiosInstance.get<{
          results: UserSearchResult[];
        }>(`/users?username=${searchTerm}`);
        // Filter out the current user from results
        const filteredResults = (response.data.results || []).filter(
          (user) => user.id !== userProfile?.id,
        );
        setSearchResults(filteredResults);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]); // Clear results on error
      } finally {
        setIsSearchingOpponent(false);
      }
    }, 500), // 500ms debounce delay
    [userProfile], // Recreate debounce function if userProfile changes
  );

  // Handle search input change
  const handleOpponentSearchChange = (
    event: React.SyntheticEvent,
    newValue: string,
  ) => {
    setOpponentSearch(newValue);
    debouncedSearch(newValue);
  };

  // Handle opponent selection
  const handleOpponentSelection = (
    event: React.SyntheticEvent,
    value: UserSearchResult | null,
  ) => {
    setOpponentId(value ? value.id : null);
  };

  // Fetch venues on component mount
  useEffect(() => {
    const fetchVenues = async () => {
      setIsFetchingVenues(true);
      setFetchVenuesError(null);
      try {
        const response = await axiosInstance.get<Venue[]>("/venues");
        setVenues(response.data || []); // Ensure it's always an array
      } catch (err) {
        console.error("Error fetching venues:", err);
        setFetchVenuesError("Failed to load venues.");
      } finally {
        setIsFetchingVenues(false);
      }
    };
    fetchVenues();
  }, []);

  // Fetch tables when venueId changes
  useEffect(() => {
    if (venueId) {
      const fetchTables = async () => {
        setIsFetchingTables(true);
        setFetchTablesError(null);
        setTableId(""); // Reset table selection when venue changes
        try {
          const response = await axiosInstance.get<Table[]>(
            `/venues/${venueId}/tables`,
          );
          setTables(response.data || []); // Ensure it's always an array
        } catch (err) {
          console.error(`Error fetching tables for venue ${venueId}:`, err);
          setFetchTablesError("Failed to load tables for the selected venue.");
          setTables([]); // Clear tables on error
        } finally {
          setIsFetchingTables(false);
        }
      };
      fetchTables();
    } else {
      setTables([]); // Clear tables if no venue is selected
    }
  }, [venueId]);

  const handleCreateGame = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    // Check if user profile (with DB ID) is loaded
    if (profileLoading) {
      setSubmitError("User profile is still loading, please wait.");
      setIsSubmitting(false);
      return;
    }
    if (!userProfile || !userProfile.id) {
      setSubmitError(
        profileError ||
          "Could not load user profile. Please try logging out and back in.",
      );
      setIsSubmitting(false);
      return;
    }

    // Updated validation
    if (!gameType || !venueId || !tableId || !opponentId) {
      setSubmitError(
        "Please fill in all required fields (Game Type, Venue, Table, Opponent).",
      );
      setIsSubmitting(false);
      return;
    }
    if (opponentId === userProfile.id) {
      // Add validation for opponent != self
      setSubmitError("You cannot select yourself as the opponent.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      venue_id: venueId,
      game_type: gameType,
      table_id: tableId,
      players: [
        { id: userProfile.id },
        { id: opponentId }, // Use selected opponent ID
      ],
    };

    try {
      const response = await axiosInstance.post("/games", payload);
      console.log("Game created successfully:", response.data);
      alert("Game created successfully! (Check console for details)");
      // Reset form
      setGameType("");
      setOpponentId(null); // Reset opponent selection
      setOpponentSearch(""); // Clear search input
      setSearchResults([]); // Clear search results
      setVenueId("");
      setTableId("");
    } catch (err: any) {
      console.error("Error creating game:", err);
      setSubmitError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create game. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTournamentCreate = async () => {
    setTournamentLoading(true);
    setTournamentError(null);
    try {
      if (!userProfile?.id) throw new Error('User not loaded');
      await tournamentApi.createTournament({
        name: tournamentName,
        organizer_id: userProfile.id,
        tournament_type: tournamentType,
        game_type: tournamentGameType,
        format,
      });
      setTournamentName('');
      // Optionally: trigger a refresh of tournament list elsewhere
    } catch (err: any) {
      setTournamentError(
        err.response?.data?.error || err.message || 'Failed to create tournament.'
      );
    } finally {
      setTournamentLoading(false);
    }
  };

  // Add check for profile loading state
  if (profileLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  // Add check for profile error state
  if (profileError) {
    return (
      <Alert severity="error">
        Failed to load user profile: {profileError}
      </Alert>
    );
  }

  return (
    <Box component="form" sx={{ mt: 3, maxWidth: 500, mx: "auto" }}>
      <Typography variant="h6" gutterBottom align="center">
        Create New Game
      </Typography>

      {/* Display errors */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}
      {fetchVenuesError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {fetchVenuesError}
        </Alert>
      )}
      {fetchTablesError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {fetchTablesError}
        </Alert>
      )}

      {/* Game Type Select */}
      <FormControl fullWidth margin="normal" required>
        <InputLabel id="game-type-label">Game Type</InputLabel>
        <Select
          labelId="game-type-label"
          id="game-type-select"
          value={gameType}
          label="Game Type"
          onChange={(e) => setGameType(e.target.value)}
          disabled={isSubmitting}
        >
          <MenuItem value="">
            <em>Select Game Type</em>
          </MenuItem>
          <MenuItem value={"8-ball"}>8-Ball</MenuItem>
          <MenuItem value={"9-ball"}>9-Ball</MenuItem>
          <MenuItem value={"practice"}>Practice</MenuItem>
        </Select>
      </FormControl>

      {/* Opponent Autocomplete */}
      <Autocomplete
        id="opponent-select"
        options={searchResults}
        getOptionLabel={(option) => option.username} // Display username in options
        isOptionEqualToValue={(option, value) => option.id === value.id} // How to compare options
        filterOptions={(x) => x} // Disable frontend filtering, rely on backend search
        onInputChange={handleOpponentSearchChange}
        onChange={handleOpponentSelection}
        inputValue={opponentSearch}
        loading={isSearchingOpponent}
        disabled={isSubmitting || profileLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search Opponent by Username"
            required
            margin="normal"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {isSearchingOpponent ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
          />
        )}
      />

      {/* Venue Select */}
      <FormControl fullWidth margin="normal" required>
        <InputLabel id="venue-select-label">Venue</InputLabel>
        <Select
          labelId="venue-select-label"
          id="venue-select"
          value={venueId}
          label="Venue"
          onChange={(e) => setVenueId(e.target.value as number)}
          disabled={isSubmitting || isFetchingVenues}
        >
          <MenuItem value="">
            <em>{isFetchingVenues ? "Loading Venues..." : "Select Venue"}</em>
          </MenuItem>
          {venues.map((venue) => (
            <MenuItem key={venue.id} value={venue.id}>
              {venue.name} (ID: {venue.id})
            </MenuItem>
          ))}
        </Select>
        {isFetchingVenues && (
          <CircularProgress
            size={20}
            sx={{
              position: "absolute",
              right: 40,
              top: "50%",
              marginTop: "-10px",
            }}
          />
        )}
      </FormControl>

      {/* Table Select */}
      <FormControl
        fullWidth
        margin="normal"
        required
        disabled={!venueId || isFetchingTables || isSubmitting}
      >
        <InputLabel id="table-select-label">Table</InputLabel>
        <Select
          labelId="table-select-label"
          id="table-select"
          value={tableId}
          label="Table"
          onChange={(e) => setTableId(e.target.value as number)}
        >
          <MenuItem value="">
            <em>{isFetchingTables ? "Loading Tables..." : "Select Table"}</em>
          </MenuItem>
          {tables.map((table) => (
            // Only show available tables? Might need filtering based on status
            <MenuItem
              key={table.id}
              value={table.id}
              disabled={table.status !== "available"}
            >
              Table {table.name || table.id}{" "}
              {table.status !== "available" ? `(${table.status})` : ""}
            </MenuItem>
          ))}
        </Select>
        {isFetchingTables && (
          <CircularProgress
            size={20}
            sx={{
              position: "absolute",
              right: 40,
              top: "50%",
              marginTop: "-10px",
            }}
          />
        )}
      </FormControl>

      {/* Submit Button */}
      <Box sx={{ mt: 3, mb: 2, position: "relative" }}>
        <Button
          type="button"
          fullWidth
          variant="contained"
          onClick={handleCreateGame}
          disabled={
            isSubmitting ||
            isFetchingVenues ||
            isFetchingTables ||
            profileLoading ||
            isSearchingOpponent
          }
        >
          Create Game
        </Button>
        {isSubmitting && (
          <CircularProgress
            size={24}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-12px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>

      {/* Tournament Creation Form */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Create Tournament</Typography>
        <TextField label="Tournament Name" value={tournamentName} onChange={e => setTournamentName(e.target.value)} fullWidth margin="normal" />
        <FormControl fullWidth margin="normal">
          <InputLabel>Tournament Type</InputLabel>
          <Select value={tournamentType} onChange={e => setTournamentType(e.target.value)}>
            <MenuItem value="single_elimination">Single Elimination</MenuItem>
            <MenuItem value="double_elimination">Double Elimination</MenuItem>
            <MenuItem value="round_robin">Round Robin</MenuItem>
            <MenuItem value="swiss">Swiss</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Game Type</InputLabel>
          <Select value={tournamentGameType} onChange={e => setTournamentGameType(e.target.value)}>
            <MenuItem value="eight_ball">8-Ball</MenuItem>
            <MenuItem value="nine_ball">9-Ball</MenuItem>
            <MenuItem value="ten_ball">10-Ball</MenuItem>
            <MenuItem value="straight_pool">Straight Pool</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Format</InputLabel>
          <Select value={format} onChange={e => setFormat(e.target.value)}>
            <MenuItem value="bracket">Bracket</MenuItem>
            <MenuItem value="league">League</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleTournamentCreate} disabled={tournamentLoading} sx={{ mt: 2 }}>
          {tournamentLoading ? <CircularProgress size={20} /> : 'Create Tournament'}
        </Button>
        {tournamentError && <Alert severity="error" sx={{ mt: 2 }}>{tournamentError}</Alert>}
      </Box>
    </Box>
  );
};

export default CreateGameForm;
