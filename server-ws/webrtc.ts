import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import db from './db/database-connection' // Assuming you're using PostgreSQL

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

const users: { [key: string]: { roomId: string; username: string } } = {} // Store users by socket ID

wsNamespace.on('connection', socket => {
	console.log(`(/ws namespace) connect ${socket.id}`)

	socket.on('join', async ({ roomId, username }) => {
		socket.join(roomId)
		users[socket.id] = { roomId, username }
		console.log(`Client ${socket.id} joined room ${roomId}`)

		// Retrieve chat history
		const chatHistory = await getChatHistory(roomId)
		socket.emit('chatHistory', chatHistory)

		wsNamespace.to(roomId).emit(
			'users',
			Object.values(users).filter(user => user.roomId === roomId)
		)
	})

	socket.on('message', async data => {
		console.log(`Message from ${socket.id} in room ${data.roomId}: ${data.message}`)
		await saveMessage(data.roomId, users[socket.id].username, data.message)
		wsNamespace.to(data.roomId).emit('message', { user: users[socket.id].username, message: data.message })
	})

	socket.on('disconnect', reason => {
		console.log(`(/ws namespace) disconnect ${socket.id} due to ${reason}`)
		const { roomId } = users[socket.id]
		delete users[socket.id]
		wsNamespace.to(roomId).emit(
			'users',
			Object.values(users).filter(user => user.roomId === roomId)
		)
	})

	// Handle WebRTC signaling messages
	socket.on('webrtc-offer', data => {
		wsNamespace.to(data.roomId).emit('webrtc-offer', data)
	})

	socket.on('webrtc-answer', data => {
		wsNamespace.to(data.roomId).emit('webrtc-answer', data)
	})

	socket.on('webrtc-ice-candidate', data => {
		wsNamespace.to(data.roomId).emit('webrtc-ice-candidate', data)
	})
})

const getChatHistory = async (roomId: string) => {
	const result = await db.query(
		'SELECT username, message FROM chat_history WHERE room_id = $1 ORDER BY timestamp ASC',
		[roomId]
	)
	return result.rows
}

const saveMessage = async (roomId: string, username: string, message: string) => {
	await db.query('INSERT INTO chat_history (room_id, username, message, timestamp) VALUES ($1, $2, $3, NOW())', [
		roomId,
		username,
		message,
	])
}

app.get('/', (req, res) => {
	res.send('WebRTC signaling server is running')
})

server.listen(PORT, () => {
	console.log(`WebRTC signaling server is running on port ${PORT}`)
})
