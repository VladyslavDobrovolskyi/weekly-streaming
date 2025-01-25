import express from 'express'
import userRoutes from './routes/userRoutes'
import roomReservationsRoutes from './routes/roomRoutes'
import authRoutes from './routes/authRoutes'

const app = express()
const port = 8888

app.use(express.json())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/room_reservations', roomReservationsRoutes)

app.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})
