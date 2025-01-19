import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: '*',
	},
})

const PORT = process.env.PORT || 9999

// Namespace '/socket.io'
const wsNamespace = io.of('/socket.io')

wsNamespace.on('connection', socket => {
	console.log(`(/ws namespace) connect ${socket.id}`)

	socket.on('join', roomId => {
		socket.join(roomId)
		console.log(`Client ${socket.id} joined room ${roomId}`)
	})

	socket.on('message', data => {
		console.log(`Message from ${socket.id} in room ${data.roomId}: ${data.message}`)
		wsNamespace.to(data.roomId).emit('message', { user: socket.id, message: data.message })
	})

	socket.on('disconnect', reason => {
		console.log(`(/ws namespace) disconnect ${socket.id} due to ${reason}`)
	})
})

app.get('/', (req, res) => {
	res.send('WebRTC signaling server is running')
})

server.listen(PORT, () => {
	console.log(`WebRTC signaling server is running on port ${PORT}`)
})
