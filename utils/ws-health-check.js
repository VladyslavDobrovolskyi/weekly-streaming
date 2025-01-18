import WebSocket from 'ws'

const socket = new WebSocket('https://streaming.vladyslavdobrovolskyi.tech/socket.io')

socket.on('open', () => {
	console.log('WebSocket connection established')

	// Send a test message to the server
	socket.send(JSON.stringify({ type: 'test', message: 'Hello, server!' }))

	// Keep the connection open for 10 seconds to see if any messages are received
	setTimeout(() => {
		console.log('Closing WebSocket connection')
		socket.close()
	}, 10000)
})

socket.on('message', data => {
	try {
		console.log('Received message from server:', data)
	} catch (error) {
		console.error('Error parsing message:', error)
	}
})

socket.on('close', () => {
	console.log('WebSocket connection closed')
})

socket.on('error', err => {
	console.error('WebSocket connection error:', err.message)
})
