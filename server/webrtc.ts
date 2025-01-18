import express, { Request, Response } from 'express'
import http from 'http'
import ws from 'ws'
import { validate, version } from 'uuid'

const app = express()
const server = http.createServer(app)
const wss = new ws.WebSocketServer({ server })

const PORT = process.env.PORT || 9999

interface CustomWebSocket extends ws.WebSocket {
	room?: string | null
}

function getClientRooms(): string[] {
	const rooms = new Set<string>()
	wss.clients.forEach((client: CustomWebSocket) => {
		if (client.room) {
			rooms.add(client.room)
		}
	})
	return Array.from(rooms).filter(roomID => validate(roomID) && version(roomID) === 4)
}

function shareRoomsInfo(): void {
	const rooms = getClientRooms()
	wss.clients.forEach(client => {
		client.send(JSON.stringify({ type: 'share-rooms', rooms }))
	})
}

wss.on('connection', (ws: CustomWebSocket) => {
	console.log('Client connected')

	shareRoomsInfo()

	ws.on('message', message => {
		const data = JSON.parse(message.toString())
		switch (data.type) {
			case 'join': {
				console.log('Received join request for room:', data.roomId)
				ws.room = data.roomId
				const clientsInRoom = Array.from(wss.clients).filter(
					(client: CustomWebSocket) => client.room === data.roomId
				)

				if (clientsInRoom.length === 1) {
					ws.send(JSON.stringify({ type: 'init' }))
				} else if (clientsInRoom.length === 2) {
					clientsInRoom.forEach(client => {
						client.send(JSON.stringify({ type: 'ready' }))
					})
				} else {
					ws.room = null
					ws.send(JSON.stringify({ type: 'full' }))
				}
				break
			}
			case 'signal':
				console.log('Received signal:', data)
				wss.clients.forEach((client: CustomWebSocket) => {
					if (client.room === data.room) {
						client.send(JSON.stringify({ type: 'desc', desc: data.desc }))
					}
				})
				break
			default:
				break
		}
	})

	ws.on('close', () => {
		if (ws.room) {
			wss.clients.forEach((client: CustomWebSocket) => {
				if (client.room === ws.room) {
					client.send(JSON.stringify({ type: 'disconnected' }))
				}
			})
		}
	})

	ws.on('error', error => {
		console.error('WebSocket error:', error)
	})
})

app.get('/', (req: Request, res: Response) => {
	res.send('WebRTC signaling server is running')
})

server.listen(PORT, () => {
	console.log(`WebRTC signaling server is running on port ${PORT}`)
})
