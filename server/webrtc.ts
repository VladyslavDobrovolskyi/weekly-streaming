import { Server } from 'ws'

const wss = new Server({ port: 8080 })

wss.on('connection', ws => {
	ws.on('message', message => {
		// Broadcast the message to all connected clients
		wss.clients.forEach(client => {
			if (client !== ws && client.readyState === ws.OPEN) {
				client.send(message)
			}
		})
	})
})

console.log('WebRTC signaling server is running on ws://localhost:8080')
