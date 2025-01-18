import ws from 'ws'

const wss = new ws.Server({ port: 9999 })

wss.on('connection', ws => {
	ws.on('message', message => {
		console.log('Received message:', message)

		// Echo the received message back to the client
		ws.send(message)
	})

	ws.on('close', () => {
		console.log('Client disconnected')
	})

	ws.on('error', error => {
		console.error('WebSocket error:', error)
	})
})

console.log('WebRTC signaling server is running on ws://localhost:9999')
