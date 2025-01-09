import { matchUpdateService } from '../match-updates';
import wsService from '../websocket';

// Mock the WebSocket service
jest.mock('../websocket', () => ({
    subscribe: jest.fn(),
    send: jest.fn(),
    emit: jest.fn()
}));

describe('MatchUpdateService', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should set up WebSocket subscriptions', () => {
            expect(wsService.subscribe).toHaveBeenCalledTimes(3);
            expect(wsService.subscribe).toHaveBeenCalledWith('match:update', expect.any(Function));
            expect(wsService.subscribe).toHaveBeenCalledWith('match:score', expect.any(Function));
            expect(wsService.subscribe).toHaveBeenCalledWith('match:spectators', expect.any(Function));
        });
    });

    describe('subscribeToMatch', () => {
        it('should subscribe to match updates', () => {
            const mockCallback = jest.fn();
            const matchId = 'test-match-id';

            matchUpdateService.subscribeToMatch(matchId, mockCallback);

            expect(wsService.subscribe).toHaveBeenCalledWith(
                `match:${matchId}`,
                expect.any(Function)
            );
        });

        it('should return an unsubscribe function', () => {
            const mockCallback = jest.fn();
            const matchId = 'test-match-id';

            const unsubscribe = matchUpdateService.subscribeToMatch(matchId, mockCallback);

            expect(unsubscribe).toBeInstanceOf(Function);
        });
    });

    describe('startWatchingMatch', () => {
        it('should send watch request to WebSocket', () => {
            const matchId = 'test-match-id';
            matchUpdateService.startWatchingMatch(matchId);

            expect(wsService.send).toHaveBeenCalledWith('match:watch', {
                matchId,
                timestamp: expect.any(String)
            });
        });
    });

    describe('stopWatchingMatch', () => {
        it('should send unwatch request and clean up', () => {
            const matchId = 'test-match-id';
            matchUpdateService.stopWatchingMatch(matchId);

            expect(wsService.send).toHaveBeenCalledWith('match:unwatch', {
                matchId,
                timestamp: expect.any(String)
            });
        });
    });

    describe('updateScore', () => {
        it('should send score update to WebSocket', () => {
            const matchId = 'test-match-id';
            const score = { player1: 5, player2: 3 };

            matchUpdateService.updateScore(matchId, score);

            expect(wsService.send).toHaveBeenCalledWith('match:score-update', {
                matchId,
                score,
                timestamp: expect.any(String)
            });
        });
    });

    describe('handleMatchUpdate', () => {
        it('should update active match and notify subscribers', () => {
            const matchId = 'test-match-id';
            const update = {
                matchId,
                status: 'in_progress',
                currentScore: { player1: 5, player2: 3 }
            };

            // Simulate match subscription
            const mockCallback = jest.fn();
            matchUpdateService.subscribeToMatch(matchId, mockCallback);

            // Simulate match update
            wsService.subscribe.mock.calls[0][1]({ payload: update });

            expect(wsService.emit).toHaveBeenCalledWith(`match:${matchId}`, expect.any(Object));
        });
    });

    describe('handleScoreUpdate', () => {
        it('should update match score and notify subscribers', () => {
            const matchId = 'test-match-id';
            const score = { player1: 6, player2: 4 };

            // Simulate match subscription
            const mockCallback = jest.fn();
            matchUpdateService.subscribeToMatch(matchId, mockCallback);

            // Simulate score update
            wsService.subscribe.mock.calls[1][1]({ payload: { matchId, score } });

            expect(wsService.emit).toHaveBeenCalledWith(`match:${matchId}`, expect.any(Object));
        });
    });

    describe('updateSpectatorCount', () => {
        it('should update spectator count and notify subscribers', () => {
            const matchId = 'test-match-id';
            const count = 42;

            // Simulate match subscription
            const mockCallback = jest.fn();
            matchUpdateService.subscribeToMatch(matchId, mockCallback);

            // Simulate spectator count update
            wsService.subscribe.mock.calls[2][1]({ payload: { matchId, count } });

            expect(wsService.emit).toHaveBeenCalledWith(`match:${matchId}`, expect.any(Object));
        });
    });
}); 