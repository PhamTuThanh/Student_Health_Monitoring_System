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
	"https://*.ngrok-free.app",
	"http://192.168.*:*" // Local network for mobile testing
];

const io = new Server(server, {
	cors: {
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			
			const isAllowed = allowedOrigins.some(allowedOrigin => {
				if (allowedOrigin.includes('*')) {
					const regex = new RegExp(allowedOrigin.replace(/\*/g, '.*'));
					return regex.test(origin);
				}
				return origin === allowedOrigin;
			});

			if (isAllowed) {
				callback(null, true);
			} else {
				console.warn("CORS blocked origin:", origin);
				callback(null, true); // Allow all for now to debug mobile
			}
		},
		methods: ["GET", "POST"],
		credentials: true
	},
	pingTimeout: 60000,
	pingInterval: 25000,
	connectTimeout: 45000,
	// Thêm config cho mobile
	allowEIO3: true, // Support older clients
	transports: ['websocket', 'polling'],
	upgradeTimeout: 30000,
	httpCompression: false, // Tắt compression cho mobile
	perMessageDeflate: false
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

// Socket.IO Middleware for Authentication
io.use((socket, next) => {
    cookieParser()(socket.request, {}, () => {
        // 1. Lấy token từ cookie
        let token = socket.request.cookies?.aToken
            || socket.request.cookies?.dToken
            || socket.request.cookies?.token;

        // 2. Lấy token từ header (extraHeaders)
        if (!token && socket.handshake.headers && socket.handshake.headers.token) {
            token = socket.handshake.headers.token;
        }
        
        // 3. Lấy token từ handshake.auth (nếu dùng auth) - Mobile apps thường dùng cách này
        if (!token && socket.handshake.auth && socket.handshake.auth.token) {
            token = socket.handshake.auth.token;
        }
        
        // 4. Lấy token từ query params (fallback cho mobile)
        if (!token && socket.handshake.query && socket.handshake.query.token) {
            token = socket.handshake.query.token;
        }
        
        console.log("🔐 Socket auth attempt:");
        console.log("- Auth method:", socket.handshake.auth ? 'auth' : socket.request.cookies ? 'cookies' : 'headers');
        console.log("- Token found:", !!token);
        console.log("- Token preview:", token ? token.substring(0, 20) + '...' : 'none');

        if (!token) {
            console.log("❌ Socket Auth Error: No token provided.");
            return next(new Error("No token provided"));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log("❌ Socket Auth Error: Invalid token -", err.message);
                return next(new Error("Invalid token"));
            }
            console.log("✅ Socket auth successful for user:", decoded.id);
            socket.user = decoded;
            next();
        });
    });
});

io.on("connection", (socket) => {
	const userId = socket.user.id;
	const userInfo = `${socket.user.name || 'Unknown'} (${userId})`;
	console.log("✅ User connected:", userInfo, "Socket ID:", socket.id);
	
	// Store socket mapping
	userSocketMap[userId] = socket.id;

	// Send online users list to everyone
	io.emit("getOnlineUsers", Object.keys(userSocketMap));
	console.log("👥 Online users:", Object.keys(userSocketMap).length);

	// Handle ping/pong để maintain connection
	socket.on("ping", () => {
		socket.emit("pong");
	});

	socket.on("newMessage", (data) => {
		const receiverSocketId = userSocketMap[data.receiverId];
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", data);
			console.log("📨 Message forwarded from", userId, "to", data.receiverId);
		} else {
			console.log("⚠️ Receiver not online:", data.receiverId);
		}
	});

	socket.on("disconnect", (reason) => {
		console.log("⚠️ User disconnected:", userInfo, "Reason:", reason);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
		console.log("👥 Remaining online users:", Object.keys(userSocketMap).length);
	});

	socket.on("error", (error) => {
		console.error("❌ Socket error for user", userInfo, ":", error);
	});

	// Handle connection errors gracefully
	socket.on("connect_error", (error) => {
		console.error("❌ Connection error for user", userInfo, ":", error);
	});
});

io.on("error", (error) => {
	console.error("Socket server error:", error);
});

export { app, io, server };