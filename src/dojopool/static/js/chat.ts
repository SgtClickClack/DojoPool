// Generated type definitions

function initializeSocket(): any {
  // Implementation
}

function loadChatRooms(): any {
  // Implementation
}

function createRoomElement(room: any): any {
  // Implementation
}

function getRoomName(room: any): any {
  // Implementation
}

function loadChatRoom(roomId: any): any {
  // Implementation
}

function loadMessages(roomId: string, page: number = 1): Promise<any> {
  // Implementation
}

function createMessageElement(message: any): any {
  // Implementation
}

function appendMessage(message: any): any {
  // Implementation
}

function appendSystemMessage(content: any): any {
  // Implementation
}

function showTypingIndicator(data: any): any {
  // Implementation
}

function handleTyping(): any {
  // Implementation
}

function formatDate(dateString: any): any {
  // Implementation
}

function sendMessage(event: any): any {
  // Implementation
}

function showNewChatModal(): any {
  // Implementation
}

function loadFriendList(): any {
  // Implementation
}

function createFriendElement(friend: any): any {
  // Implementation
}

function toggleFriendSelection(friendId: any): any {
  // Implementation
}

function createChat(event: any): any {
  // Implementation
}

function setupMobileResponsiveness(): any {
  // Implementation
}

function showError(message: any): any {
  // Implementation
}

// Type imports

// Global variables
let currentRoomId = null;
let socket = null;
let selectedFriends = new Set();

// Initialize chat functionality
document.addEventListener("DOMContentLoaded", () => {
  initializeSocket();
  loadChatRooms();
  setupMobileResponsiveness();
});

// Initialize WebSocket connection
function initializeSocket(): any {
  socket = io();

  // Connection events
  socket.on("connect", () => {
    console.log("Connected to WebSocket");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from WebSocket");
  });

  // Chat events
  socket.on("message", (data) => {
    appendMessage(data);
  });

  socket.on("status", (data) => {
    if (data.status === "joined" || data.status === "left") {
      appendSystemMessage(`${data.user} has ${data.status} the chat`);
    }
  });

  socket.on("typing", (data) => {
    showTypingIndicator(data);
  });
}

// Load chat rooms
async function loadChatRooms(): any {
  try {
    const response: any = await fetch("/api/v1/chat/rooms");
    const data: any = await response.json();

    const roomsList: any = document.getElementById("chat-rooms-list");
    roomsList.innerHTML = "";

    data.rooms.forEach((room) => {
      const roomElement: any = createRoomElement(room);
      roomsList.appendChild(roomElement);
    });
  } catch (error) {
    console.error("Error loading chat rooms:", error);
    showError("Failed to load chat rooms");
  }
}

// Create room element
function createRoomElement(room: any): any {
  const div: any = document.createElement("div");
  div.className = `chat-room-item ${room.id === currentRoomId ? "active" : ""}`;
  div.onclick = () => loadChatRoom(room.id);

  const lastMessage: any =
    room.messages && room.messages.length > 0
      ? room.messages[0]
      : { content: "No messages yet" };

  div.innerHTML = `
        <div class="room-name">${room.name || getRoomName(room)}</div>
        <div class="last-message">${lastMessage.content}</div>
    `;

  return div;
}

// Get room name for direct chats
function getRoomName(room: any): any {
  if (room.type === "direct") {
    const otherParticipant: any = room.participants.find(
      (p) => p.user_id !== currentUser.id,
    );
    return otherParticipant ? otherParticipant.username : "Unknown User";
  }
  return room.name || "Group Chat";
}

// Load chat room
async function loadChatRoom(roomId: any): any {
  if (currentRoomId) {
    socket.emit("leave", { room_id: currentRoomId });
  }

  currentRoomId = roomId;
  socket.emit("join", { room_id: roomId });

  // Update active room in sidebar
  document.querySelectorAll(".chat-room-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.roomId === roomId.toString()) {
      item.classList.add("active");
    }
  });

  // Load messages
  await loadMessages(roomId);

  // Show chat messages container on mobile
  if (window.innerWidth <= 768) {
    document.querySelector(".chat-rooms").classList.remove("show");
    document.querySelector(".chat-messages").style.display = "flex";
  }
}

// Load messages
async function loadMessages(roomId: string, page: number = 1): Promise<any> {
  try {
    const response: any = await fetch(
      `/api/v1/chat/room/${roomId}/messages?page=${page}`,
    );
    const data: any = await response.json();

    const messagesList: any = document.getElementById("chat-messages-list");
    messagesList.innerHTML = "";

    data.messages.reverse().forEach((message) => {
      const messageElement: any = createMessageElement(message);
      messagesList.appendChild(messageElement);
    });

    messagesList.scrollTop = messagesList.scrollHeight;
  } catch (error) {
    console.error("Error loading messages:", error);
    showError("Failed to load messages");
  }
}

// Create message element
function createMessageElement(message: any): any {
  const div: any = document.createElement("div");

  if (message.message_type === "system") {
    div.className = "system-message";
    div.textContent = message.content;
  } else {
    div.className = `chat-message ${message.sender_id === currentUser.id ? "sent" : "received"}`;
    div.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-meta">
                ${message.sender_name} • ${formatDate(message.created_at)}
            </div>
        `;
  }

  return div;
}

// Append new message
function appendMessage(message: any): any {
  if (message.room_id !== currentRoomId) return;

  const messagesList: any = document.getElementById("chat-messages-list");
  const messageElement: any = createMessageElement(message);
  messagesList.appendChild(messageElement);

  // Scroll to bottom if already at bottom
  const shouldScroll: any =
    messagesList.scrollHeight - messagesList.scrollTop ===
    messagesList.clientHeight;
  if (shouldScroll) {
    messagesList.scrollTop = messagesList.scrollHeight;
  }
}

// Append system message
function appendSystemMessage(content: any): any {
  const messagesList: any = document.getElementById("chat-messages-list");
  const div: any = document.createElement("div");
  div.className = "system-message";
  div.textContent = content;
  messagesList.appendChild(div);
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Show typing indicator
let typingTimeout;
function showTypingIndicator(data: any): any {
  if (data.room_id !== currentRoomId) return;

  const typingIndicator: any = document.getElementById("typing-indicator");
  if (!typingIndicator) return;

  if (data.typing) {
    typingIndicator.textContent = `${data.user} is typing...`;
    typingIndicator.style.display = "block";
  } else {
    typingIndicator.style.display = "none";
  }
}

// Handle typing events
function handleTyping(): any {
  if (!currentRoomId) return;

  if (typingTimeout) clearTimeout(typingTimeout);

  socket.emit("typing", {
    room_id: currentRoomId,
    typing: true,
  });

  typingTimeout = setTimeout(() => {
    socket.emit("typing", {
      room_id: currentRoomId,
      typing: false,
    });
  }, 2000);
}

// Format date
function formatDate(dateString: any): any {
  const date: any = new Date(dateString);
  const now: any = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Send message
async function sendMessage(event: any): any {
  event.preventDefault();

  const input: any = document.getElementById("message-input");
  const content: any = input.value.trim();

  if (!content || !currentRoomId) return;

  socket.emit("message", {
    room_id: currentRoomId,
    content: content,
  });

  input.value = "";
}

// Show new chat modal
function showNewChatModal(): any {
  selectedFriends.clear();
  loadFriendList();
  const modal: any = new bootstrap.Modal(
    document.getElementById("newChatModal"),
  );
  modal.show();
}

// Load friend list
async function loadFriendList(): any {
  try {
    const response: any = await fetch("/api/v1/friends");
    const data: any = await response.json();

    const friendList: any = document.getElementById("friend-select-list");
    friendList.innerHTML = "";

    data.friends.forEach((friend) => {
      const friendElement: any = createFriendElement(friend);
      friendList.appendChild(friendElement);
    });
  } catch (error) {
    console.error("Error loading friends:", error);
    showError("Failed to load friends");
  }
}

// Create friend element
function createFriendElement(friend: any): any {
  const div: any = document.createElement("div");
  div.className = "friend-item";
  div.dataset.friendId = friend.id;
  div.onclick = () => toggleFriendSelection(friend.id);

  div.innerHTML = `
        <img src="${friend.avatar_url || "/static/img/default-avatar.png"}" alt="${friend.username}">
        <div class="friend-name">${friend.username}</div>
    `;

  return div;
}

// Toggle friend selection
function toggleFriendSelection(friendId: any): any {
  const friendElement: any = document.querySelector(
    `.friend-item[data-friend-id="${friendId}"]`,
  );

  if (selectedFriends.has(friendId)) {
    selectedFriends.delete(friendId);
    friendElement.classList.remove("selected");
  } else {
    selectedFriends.add(friendId);
    friendElement.classList.add("selected");
  }

  // Show/hide group name input based on selection count
  const groupNameDiv: any = document.querySelector(".group-chat-name");
  groupNameDiv.style.display = selectedFriends.size > 1 ? "block" : "none";
}

// Create chat
async function createChat(event: any): any {
  event.preventDefault();

  if (selectedFriends.size === 0) {
    showError("Please select at least one friend");
    return;
  }

  const data: any = {
    participant_ids: Array.from(selectedFriends),
    name: document.getElementById("group-name").value,
  };

  try {
    const response: any = await fetch("/api/v1/chat/room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const room: any = await response.json();
      bootstrap.Modal.getInstance(
        document.getElementById("newChatModal"),
      ).hide();
      await loadChatRooms();
      loadChatRoom(room.id);
    }
  } catch (error) {
    console.error("Error creating chat:", error);
    showError("Failed to create chat");
  }
}

// Mobile responsiveness
function setupMobileResponsiveness(): any {
  if (window.innerWidth <= 768) {
    // Add back button to chat header
    const header: any = document.getElementById("chat-messages-header");
    const backButton: any = document.createElement("button");
    backButton.className = "btn btn-link back-to-rooms";
    backButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
    backButton.onclick = () => {
      document.querySelector(".chat-rooms").classList.add("show");
      document.querySelector(".chat-messages").style.display = "none";
    };
    header.insertBefore(backButton, header.firstChild);

    // Initially show rooms list
    document.querySelector(".chat-rooms").classList.add("show");
    document.querySelector(".chat-messages").style.display = "none";
  }
}

// Error handling
function showError(message: any): any {
  // Implement error notification
  console.error(message);
}
