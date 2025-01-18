import { Server, Socket } from 'socket.io'
import http from 'http'
import { validate, version } from 'uuid'

const server = http.createServer()
const io = new Server(server, {
	cors: {
		origin: '*',
	},
})

const PORT = process.env.PORT || 9999

interface CustomSocket extends Socket {
	room?: string | null
}

function getClientRooms(): string[] {
	const { rooms } = io.sockets.adapter
	return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4)
}

function shareRoomsInfo(): void {
	io.emit('share-rooms', {
		rooms: getClientRooms(),
	})
}

io.on('connection', (socket: CustomSocket) => {
	console.log('Client connected:', socket.id)

	shareRoomsInfo()

	socket.on('join', (data: { roomId: string }) => {
		socket.join(data.roomId)
		socket.room = data.roomId
		const sockets = io.of('/').adapter.rooms.get(data.roomId)
		const numClients = sockets ? sockets.size : 0

		if (numClients === 1) {
			socket.emit('init')
		} else if (numClients === 2) {
			io.to(data.roomId).emit('ready')
		} else {
			socket.room = null
			socket.leave(data.roomId)
			socket.emit('full')
		}
	})

	socket.on('signal', (data: { room: string; desc: RTCSessionDescriptionInit | RTCIceCandidate }) => {
		io.to(data.room).emit('desc', data.desc)
	})

	socket.on('disconnect', () => {
		if (socket.room) {
			io.to(socket.room).emit('disconnected')
		}
	})

	socket.on('error', (error: Error) => {
		console.error('Socket error:', error)
	})
})

server.listen(PORT, () => {
	console.log(`WebRTC signaling server is running on port ${PORT}`)
})
