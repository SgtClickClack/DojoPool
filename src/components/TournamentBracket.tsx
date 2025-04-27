import React from 'react';
import {
    SingleEliminationBracket,
    DoubleEliminationBracket,
    Match,
    SVGViewer,
    // Define type for library's expected match structure
    // Need to import or define based on library's actual exports
} from '@g-loot/react-tournament-brackets';

// Re-import or define our internal Match structure
import { Match as InternalMatch } from '../pages/TournamentDetailPage'; // Assuming it's exported

interface TournamentBracketProps {
  matches: InternalMatch[];
  participants: Array<{ user_id: number; username: string; seed?: number }>; // Needed for participant names
  format: string; // Tournament format ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION')
}

// Helper function to transform our match data to the library's format
const transformMatchesForLibrary = (internalMatches: InternalMatch[], participants: any[], format: string) => {
    // --- Placeholder Transformation Logic --- //
    // This needs significant implementation based on the library's expected structure
    // and how your backend generates/stores match progression.

    const participantMap = participants.reduce((acc, p) => {
        acc[p.user_id] = p.username;
        return acc;
    }, {});

    const libraryMatches = internalMatches.map(match => ({
        id: match.id,
        name: `R${match.round} M${match.match_number ?? '-'}`, // Example name
        nextMatchId: null, // *** CRITICAL: Need logic to determine the ID of the next match ***
        nextLooserMatchId: format === 'DOUBLE_ELIMINATION' ? null : undefined, // *** CRITICAL: Need DE logic ***
        tournamentRoundText: `${match.round}`,
        startTime: new Date().toISOString(), // Placeholder
        state: match.status === 'COMPLETED' ? 'DONE' : (match.status === 'PENDING' ? 'SCHEDULED' : 'EMPTY'), // Map status
        participants: [
            {
                id: match.player1_id ?? `p1-placeholder-${match.id}`,
                resultText: match.winner_id === match.player1_id ? "Win" : (match.status === 'COMPLETED' ? "Loss" : null),
                isWinner: match.winner_id === match.player1_id,
                status: match.status === 'COMPLETED' ? 'PLAYED' : null,
                name: participantMap[match.player1_id ?? -1] ?? (match.player1_id ? `Player ${match.player1_id}` : 'TBD')
            },
            {
                id: match.player2_id ?? `p2-placeholder-${match.id}`,
                resultText: match.winner_id === match.player2_id ? "Win" : (match.status === 'COMPLETED' ? "Loss" : null),
                isWinner: match.winner_id === match.player2_id,
                status: match.status === 'COMPLETED' ? 'PLAYED' : null,
                name: participantMap[match.player2_id ?? -1] ?? (match.player2_id ? `Player ${match.player2_id}` : 'TBD')
            }
        ].filter(p => p.id) // Filter out placeholders if player ID was null
    }));

    if (format === 'DOUBLE_ELIMINATION') {
        // *** CRITICAL: Split matches into upper/lower based on bracket_type ***
        // This placeholder just returns all matches in upper
        return { upper: libraryMatches, lower: [] };
    }

    return libraryMatches; // For Single Elimination
};

const TournamentBracket: React.FC<TournamentBracketProps> = ({ matches, participants, format }) => {

  // Transform the data
  // NOTE: This transformation is complex and highly dependent on your data structure and backend logic.
  // The placeholder below WILL NOT WORK correctly without implementing the actual logic
  // to determine nextMatchId, nextLooserMatchId, and splitting DE brackets.
  const transformedMatches = React.useMemo(
      () => transformMatchesForLibrary(matches, participants, format),
      [matches, participants, format]
  );

  // Basic wrapper with SVGViewer for panning/zooming
  // Adjust width/height as needed or use dynamic sizing
  const bracketWrapper = ({ children, ...props }: any) => (
    <SVGViewer width={800} height={600} {...props}>
      {children}
    </SVGViewer>
  );

  if (format === 'SINGLE_ELIMINATION') {
    return (
        <div>
            <h2>Bracket (Single Elimination)</h2>
            <SingleEliminationBracket
                matches={transformedMatches as any} // Cast needed due to placeholder transform
                matchComponent={Match} // Use default Match component from library
                svgWrapper={bracketWrapper}
            />
        </div>
    );
  } else if (format === 'DOUBLE_ELIMINATION') {
    return (
        <div>
            <h2>Bracket (Double Elimination)</h2>
            <DoubleEliminationBracket
                matches={transformedMatches as any} // Cast needed due to placeholder transform
                matchComponent={Match}
                svgWrapper={bracketWrapper}
            />
        </div>
    );
  } else {
    return <div>Bracket view not supported for {format} format.</div>;
  }
};

export default TournamentBracket; 