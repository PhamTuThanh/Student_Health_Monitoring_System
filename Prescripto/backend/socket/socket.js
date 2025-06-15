import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: ["http://localhost:5174", "http://localhost:8081", "https://*.ngrok-free.app", "http://localhost:*" ],
		methods: ["GET", "POST"],
		credentials: true
	},
	pingTimeout: 60000,
	pingInterval: 25000,
	connectTimeout: 45000,
});

const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
	console.log("New connection attempt");
	
	const userId = socket.handshake.query.userId;
	if (userId != "undefined") {
		userSocketMap[userId] = socket.id;
		console.log(`User ${userId} connected`);
	}

	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	socket.on("newMessage", (data) => {
		const receiverSocketId = userSocketMap[data.receiverId];
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", data);
		}
	});

	socket.on("disconnect", () => {
		const userId = socket.handshake.query.userId;
		console.log("user disconnected", userId);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});

	socket.on("error", (error) => {
		console.error("Socket error:", error);
	});
});

io.on("error", (error) => {
	console.error("Socket server error:", error);
});

export { app, io, server };