import express from 'express'
import userRoutes from './routes/userRoutes'
import roomReservationsRoutes from './routes/roomRoutes'

const app = express()
const port = 8888

app.use(express.json())

app.use('/users', userRoutes)
app.use('/room_reservations', roomReservationsRoutes)

app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
