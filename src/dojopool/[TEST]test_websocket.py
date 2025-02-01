"""WebSocket test client."""

import socketio


def test_websocket():
    """Test WebSocket connection and messaging."""
    # Create SocketIO client
    sio = socketio.Client()

    @sio.event
    def connect():
        print("Connected to server")
        # Send a test message
        sio.emit("message", {"data": "Hello Server!"})

    @sio.event
    def disconnect():
        print("Disconnected from server")

    @sio.on("welcome")
    def on_welcome(data):
        print("Received welcome:", data)

    @sio.on("response")
    def on_response(data):
        print("Received response:", data)
        sio.disconnect()

    try:
        print("Attempting to connect to server...")
        sio.connect("http://127.0.0.1:5000")
        sio.wait()
    except Exception as e:
        print("Error:", e)
    finally:
        if sio.connected:
            sio.disconnect()


if __name__ == "__main__":
    test_websocket()
