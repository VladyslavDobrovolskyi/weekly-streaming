import { io } from 'socket.io-client'

const socket = io('https://streaming.vladyslavdobrovolskyi.tech/ws')

socket.on('connect', () => {
	console.log('Socket.io connection established')

	// Send a test message to the server
	socket.emit('message', { type: 'test', message: 'Hello, server!' })

	// Keep the connection open for 10 seconds to see if any messages are received
	setTimeout(() => {
		console.log('Closing Socket.io connection')
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

socket.on('disconnect', () => {
	console.log('Socket.io connection closed')
})

socket.on('connect_error', err => {
	console.error('Socket.io connection error:', err.message)
})
