import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { GamePlay } from "../GamePlay";
import { GameBoard } from "../GameBoard";
import { GameControls } from "../GameControls";

// Mock WebSocket

// Define a mock class for WebSocket (used only as a template for instance methods/properties)
class MockWebSocketTemplate {
  send = jest.fn();
  close = jest.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0; // Initial state

  constructor(url: string | URL, protocols?: string | string[] | undefined) {
    // Simulate connection opening after a short delay
    // In a real test, you might control this more directly
    // setTimeout(() => {
    //   this.readyState = MockWebSocket.OPEN; // This line will be removed/changed
    //   if (this.onopen) {
    //     this.onopen(new Event('open'));
    //   }
    // }, 10);
  }

  // Add onopen handler property if needed by the tests
  onopen: ((event: Event) => void) | null = null;
}

// Create a Jest mock function that behaves like a constructor
const WebSocketMock = jest.fn().mockImplementation(function MockWebSocket(this: any, url: string | URL, protocols?: string | string[] | undefined) {
  // Assign instance methods/properties from the template
  Object.assign(this, new MockWebSocketTemplate(url, protocols));

  // Simulate connection opening if needed by tests
  // This can be controlled in tests by accessing the instance
});

// Assign static properties directly to the Jest mock function
// Use Object.defineProperty to ensure they are non-writable like native WebSocket
Object.defineProperty(WebSocketMock, 'CONNECTING', { value: 0, writable: false });
Object.defineProperty(WebSocketMock, 'OPEN', { value: 1, writable: false });
Object.defineProperty(WebSocketMock, 'CLOSING', { value: 2, writable: false });
Object.defineProperty(WebSocketMock, 'CLOSED', { value: 3, writable: false });

// Assign the Jest mock function (with static properties and mock capabilities) to the global object
// Use a more specific type assertion to satisfy TypeScript for both constructor and mock properties
global.WebSocket = WebSocketMock as (jest.Mock<any, any> & typeof WebSocket);

// Mock fetch
global.fetch = jest.fn();

jest.mock("@chakra-ui/icons", () => ({
  // Mock any icons or components used from @chakra-ui/icons
  // If specific icons are needed, they can be mocked individually
  // For now, returning empty objects or simple components
  StarIcon: "MockStarIcon",
  ChatIcon: "MockChatIcon",
  ShareIcon: "MockShareIcon",
  Spinner: "MockSpinner", // Explicitly mock Spinner
}));

describe("Game Components", () => {
  const renderWithChakra = (component: React.ReactElement) => {
    const system = createSystem(defaultConfig);
    return render(<ChakraProvider value={system}>{component}</ChakraProvider>);
  };

  describe("GameBoard", () => {
    const mockBalls = [
      { id: 0, x: 400, y: 300, color: "#FFFFFF", number: 0 },
      { id: 1, x: 600, y: 300, color: "#FFFF00", number: 1 },
    ];

    it("renders the pool table with balls", () => {
      renderWithChakra(
        <GameBoard
          width={800}
          height={400}
          balls={mockBalls}
          onBallClick={jest.fn()}
          onTableClick={jest.fn()}
        />,
      );

      // Check if the container is rendered
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("handles ball clicks", () => {
      const onBallClick = jest.fn();
      renderWithChakra(
        <GameBoard
          width={800}
          height={400}
          balls={mockBalls}
          onBallClick={onBallClick}
          onTableClick={jest.fn()}
        />,
      );

      // Simulate clicking on a ball
      fireEvent.click(screen.getByRole("img"));
      expect(onBallClick).toHaveBeenCalled();
    });
  });

  describe("GameControls", () => {
    it("renders controls when active", () => {
      renderWithChakra(
        <GameControls
          onShot={jest.fn()}
          isActive={true}
          onCancel={jest.fn()}
        />,
      );

      expect(screen.getByText("Shot Power")).toBeInTheDocument();
      expect(screen.getByText("Shot Angle")).toBeInTheDocument();
      expect(screen.getByText("Ball Spin")).toBeInTheDocument();
    });

    it("handles shot execution", async () => {
      const onShot = jest.fn();
      renderWithChakra(
        <GameControls onShot={onShot} isActive={true} onCancel={jest.fn()} />,
      );

      // Simulate charging and releasing shot
      const shotButton = screen.getByText("Take Shot");
      fireEvent.mouseDown(shotButton);
      await waitFor(() => {
        expect(screen.getByText("Charging...")).toBeInTheDocument();
      });
      fireEvent.mouseUp(shotButton);

      expect(onShot).toHaveBeenCalled();
    });
  });

  describe("GamePlay", () => {
    it("initializes game state", () => {
      renderWithChakra(<GamePlay gameId="test-game" />);

      expect(screen.getByText("Game Status: waiting")).toBeInTheDocument();
      expect(screen.getByText("Current Player: 1")).toBeInTheDocument();
    });

    it("handles game updates via WebSocket", async () => {
      renderWithChakra(<GamePlay gameId="test-game" />);

      // Simulate WebSocket message
      const update = {
        gameStatus: "in_progress",
        currentPlayer: 2,
      };
      // Use the latest mock instance to send the message
      const latestWebSocketInstance = (global.WebSocket as any).mock.instances[(global.WebSocket as any).mock.instances.length - 1];
      latestWebSocketInstance.onmessage({ data: JSON.stringify(update) } as MessageEvent);

      await waitFor(() => {
        expect(
          screen.getByText("Game Status: in_progress"),
        ).toBeInTheDocument();
        expect(screen.getByText("Current Player: 2")).toBeInTheDocument();
      });
    });

    it("switches to spectator mode", () => {
      renderWithChakra(<GamePlay gameId="test-game" isSpectator={true} />);

      // Check if spectator-specific elements are rendered
      expect(screen.queryByText("Take Shot")).not.toBeInTheDocument();
    });

    it("handles game end", async () => {
      const onGameEnd = jest.fn();
      renderWithChakra(<GamePlay gameId="test-game" onGameEnd={onGameEnd} />);

      // Simulate game end via WebSocket
      const update = {
        gameStatus: "finished",
        winner: 1,
      };
      // Use the latest mock instance to send the message
      const latestWebSocketInstance = (global.WebSocket as any).mock.instances[(global.WebSocket as any).mock.instances.length - 1];
      latestWebSocketInstance.onmessage({ data: JSON.stringify(update) } as MessageEvent);

      await waitFor(() => {
        expect(onGameEnd).toHaveBeenCalledWith(1);
      });
    });
  });
});
