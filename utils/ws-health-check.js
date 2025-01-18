import WebSocket from 'ws'

const ws = new WebSocket('wss://streaming.vladyslavdobrovolskyi.tech/ws/')

ws.on('open', function open() {
	console.log('WebSocket connection established')

	// Send a test message to the server
	ws.send(JSON.stringify({ type: 'test', message: 'Hello, server!' }))

	// Keep the connection open for 10 seconds to see if any messages are received
	setTimeout(() => {
		console.log('Closing WebSocket connection')
		ws.close()
	}, 10000)
})

ws.on('message', function message(data) {
	console.log('Received message from server:', data)
})

ws.on('close', function close() {
	console.log('WebSocket connection closed')
})

ws.on('error', function error(err) {
	console.error('WebSocket connection error:', err.message)
})
