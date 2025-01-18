import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
	if (req.url !== '/') {
		res.writeHead(404)
		res.end('Not found')
		return
	}

	res.writeHead(200, {
		'Content-Type': 'text/plain',
	})
	res.end('socket.io')
})

// Создаём сервер Socket.IO
const io = new Server(httpServer, {
	// Socket.IO options
})

// Namespace по умолчанию ('/')
io.on('connection', socket => {
	console.log(`(default namespace) connect ${socket.id}`)

	socket.on('disconnect', reason => {
		console.log(`(default namespace) disconnect ${socket.id} due to ${reason}`)
	})

	socket.on('howdy', arg => {
		console.log(arg)
		socket.emit('hello', 'world')
	})

	socket.on('message', arg => {
		console.log(arg)
		socket.emit('hello', 'world')
	})
})

// Namespace '/socket.io'
const wsNamespace = io.of('/socket.io')

wsNamespace.on('connection', socket => {
	console.log(`(/ws namespace) connect ${socket.id}`)

	socket.on('disconnect', reason => {
		console.log(`(/ws namespace) disconnect ${socket.id} due to ${reason}`)
	})

	socket.on('howdy', arg => {
		console.log(`(/ws namespace) howdy:`, arg)
		socket.emit('hello', 'world')
	})

	socket.on('message', arg => {
		console.log(`(/ws namespace) message:`, arg)
		socket.emit('hello', 'world')
	})
})

httpServer.listen(9999)
console.log('WS server listening on port 9999')
