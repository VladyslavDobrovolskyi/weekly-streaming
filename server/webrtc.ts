import http from 'http'
import { Server } from 'socket.io'

const server = http.createServer()
const io = new Server(server, {
	cors: {
		origin: '*',
	},
	// Specify the path for WebSocket connections
})

const PORT = process.env.PORT || 9999

io.on('connection', socket => {
	console.log('Client connected:', socket.id)

	socket.on('join', roomId => {
		socket.join(roomId)
		console.log(`Client ${socket.id} joined room ${roomId}`)
	})

	socket.on('message', data => {
		console.log(`Message from ${socket.id} in room ${data.roomId}: ${data.message}`)
		io.to(data.roomId).emit('message', data.message)
	})

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id)
	})
})

server.listen(PORT, () => {
	console.log(`WebRTC signaling server is running on port ${PORT}`)
})
