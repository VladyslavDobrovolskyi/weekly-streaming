import { Server } from 'socket.io'
import http from 'http'

const server = http.createServer()
const io = new Server(server, {
	cors: {
		origin: '*',
	},
})

io.on('connection', socket => {
	console.log('Client connected:', socket.id)

	socket.on('message', message => {
		console.log('Received message:', message)

		// Broadcast the received message to all connected clients except the sender
		socket.broadcast.emit('message', message)
	})

	socket.on('disconnect', () => {
		console.log('Client disconnected:', socket.id)
	})

	socket.on('error', error => {
		console.error('Socket error:', error)
	})
})

server.listen(9999, () => {
	console.log('WebRTC signaling server is running on :9999')
})
