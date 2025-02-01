// Tournament test data
export const testPlayers = [
    {
        id: "1",
        name: "Player 1",
        rating: 1500,
        stats: {wins: 0, losses: 0, tournamentWins: 0, averageFinish: 0},
        achievements: []
    },
    {
        id: "2",
        name: "Player 2",
        rating: 1400,
        stats: {wins: 0, losses: 0, tournamentWins: 0, averageFinish: 0},
        achievements: []
    },
    {
        id: "3",
        name: "Player 3",
        rating: 1300,
        stats: {wins: 0, losses: 0, tournamentWins: 0, averageFinish: 0},
        achievements: []
    },
    {
        id: "4",
        name: "Player 4",
        rating: 1200,
        stats: {wins: 0, losses: 0, tournamentWins: 0, averageFinish: 0},
        achievements: []
    }
];

// Game analysis test data
export const testGameState = {
    balls: [
        {number: 1, position: {x: 100, y: 200}, pocketed: false},
        {number: 2, position: {x: 300, y: 400}, pocketed: false},
        {number: 8, position: {x: 500, y: 600}, pocketed: false}
    ],
    cueBall: {position: {x: 50, y: 50}},
    currentPlayer: "player1",
    gamePhase: "in_progress"
};

export const testShot = {
    type: "normal",
    cueBall: {x: 0, y: 0},
    targetBall: {number: 1, position: {x: 100, y: 100}},
    pocket: {x: 200, y: 200},
    obstacles: []
}; 