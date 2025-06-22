import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
	"http://localhost:5173", // Frontend User
	"http://localhost:5174", // Frontend Admin
	"http://localhost:8081", // Android emulator
	"https://*.ngrok-free.app"
];

const io = new Server(server, {
	cors: {
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			
			const isAllowed = allowedOrigins.some(allowedOrigin => {
				if (allowedOrigin.includes('*')) {
					const regex = new RegExp(allowedOrigin.replace('*', '.*'));
					return regex.test(origin);
				}
				return origin === allowedOrigin;
			});

			if (isAllowed) {
				callback(null, true);
			} else {
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ["GET", "POST"],
		credentials: true
	},
	pingTimeout: 60000,
	pingInterval: 25000,
	connectTimeout: 45000,
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

// Socket.IO Middleware for Authentication
io.use((socket, next) => {
    cookieParser()(socket.request, {}, () => {
        // 1. Lấy token từ cookie
        let token = socket.request.cookies.aToken
            || socket.request.cookies.dToken
            || socket.request.cookies.token;

        // 2. Lấy token từ header (extraHeaders)
        if (!token && socket.handshake.headers && socket.handshake.headers.token) {
            token = socket.handshake.headers.token;
        }
        // 3. Lấy token từ handshake.auth (nếu dùng auth)
        if (!token && socket.handshake.auth && socket.handshake.auth.token) {
            token = socket.handshake.auth.token;
        }
		console.log("socket auth token", token);

        if (!token) {
            console.log("Socket Auth Error: No token provided.");
            return next(new Error("Authentication error: No token provided."));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log("Socket Auth Error: Invalid token.");
                return next(new Error("Authentication error: Invalid token."));
            }
            socket.user = decoded;
            next();
        });
    });
});

io.on("connection", (socket) => {
	const userId = socket.user.id;
	console.log("A user connected:", userId, "Socket ID:", socket.id);
	userSocketMap[userId] = socket.id;

	// Send online users list to everyone
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	socket.on("newMessage", (data) => {
		const receiverSocketId = userSocketMap[data.receiverId];
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", data);
		}
	});

	socket.on("disconnect", () => {
		console.log("User disconnected:", userId);
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