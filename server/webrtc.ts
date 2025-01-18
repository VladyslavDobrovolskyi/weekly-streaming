import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer((req, res) => {
	if (req.url !== '/') {
		res.writeHead(404)
		res.end('Not found')
		return
	}
	// reload the file every time

	res.writeHead(200, {
		'Content-Type': 'text',
		'Content-Length': length,
	})
	res.end('socket.io')
})

const io = new Server(httpServer, {
	// Socket.IO options
})

io.on('connection', socket => {
	console.log(`connect ${socket.id}`)

	socket.on('disconnect', reason => {
		console.log(`disconnect ${socket.id} due to ${reason}`)
	})
})

httpServer.listen(9999)
