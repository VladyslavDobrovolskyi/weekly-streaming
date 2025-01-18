import ws from 'ws'

const wss = new ws.Server({ port: 9999 })

wss.on('connection', ws => {
	console.log('Client connected')

	ws.on('message', message => {
		console.log('Received message:', message)

		// Broadcast the received message to all connected clients
		wss.clients.forEach(client => {
			if (client !== ws && client.readyState === ws.OPEN) {
				client.send(message)
			}
		})
	})

	ws.on('close', () => {
		console.log('Client disconnected')
	})

	ws.on('error', error => {
		console.error('WebSocket error:', error)
	})
})

console.log('WebRTC signaling server is running on ws://localhost:9999')
