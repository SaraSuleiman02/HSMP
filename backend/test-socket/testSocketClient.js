import { io } from "socket.io-client";

const socket = io("http://localhost:8000", {
    transports: ["websocket"],
    reconnection: true,
});

const myUserId = "6813a6cc6dd52f1234bf27f5";
const chatRoomId = "68168f244045a441b9fc5496";
const receiverId = "6814a02a012362c7be1bc918";

// Register the user on connect
socket.on("connect", () => {
    console.log(`✅ Connected to server. Socket ID: ${socket.id}`);

    // Register yourself on the server
    socket.emit("register", myUserId);
    console.log("📝 Registered user:", myUserId);

    // Wait a second, then send a test message
    setTimeout(() => {
        socket.emit("sendMessage", {
            chatRoomId,
            senderId: myUserId,
            receiverId,
            content: "Hello from the test client! 👋",
        });
        console.log("📨 Sent message to", receiverId);
    }, 1000);
});

// Listen for confirmation
socket.on("messageSent", (data) => {
    console.log("✅ Message saved & emitted:", data);
});

// Listen for incoming messages
socket.on("newMessage", (data) => {
    console.log("💬 New message received:", data);
});

// Handle errors or disconnects
socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

socket.on("connect_error", (err) => {
    console.log("⚠️ Connection error:", err.message);
});