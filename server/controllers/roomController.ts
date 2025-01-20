import { Request, Response } from 'express'

interface AuthenticatedRequest extends Request {
	user: {
		id: string
	}
}
import {
	getAllRoomReservations,
	addRoomReservation,
	deleteRoomReservation,
	getUsersInRoom,
	getRoomByUserId,
} from '../services/roomService'
import { getUserById } from '../services/userService'

export const getAllRoomReservationsHandler = async (req: Request, res: Response) => {
	try {
		const reservations = await getAllRoomReservations()
		res.json(reservations)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const addRoomReservationHandler = async (req: Request, res: Response) => {
	const { room_id, user_id } = req.body
	try {
		await addRoomReservation(room_id, user_id)
		res.status(201).json({ message: 'Room reservation added' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const deleteRoomReservationHandler = async (req: Request, res: Response) => {
	const { room_id, user_id } = req.body
	try {
		await deleteRoomReservation(room_id, user_id)
		res.status(200).json({ message: 'Room reservation deleted' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const getUsersInRoomHandler = async (req: Request, res: Response) => {
	const { roomId } = req.params
	try {
		const users = await getUsersInRoom(roomId)
		res.json(users)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const getRoomByUser = async (req: AuthenticatedRequest, res: Response) => {
	const userId = Number(req.user.id)

	try {
		const room = await getRoomByUserId(userId)
		room.user_id = userId
		if (!room) {
			return res.status(404).json({ message: 'Room not found' })
		}
		res.json({ room })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const getRoomData = async (req: AuthenticatedRequest, res: Response) => {
	const userId = Number(req.user.id) // Assuming req.user is set by authMiddleware
	try {
		console.log(`Fetching room data for user ID: ${userId}`)
		const room = await getRoomByUserId(userId)
		if (!room) {
			return res.status(404).json({ message: 'Room not found' })
		}
		console.log(`Room found: ${room.room_id}`)
		const users = await getUsersInRoom(room.room_id)
		console.log(`Users in room: ${users}`)
		const userDetails = await Promise.all(
			users.map(async (userId: number) => {
				const user = await getUserById(userId)
				return user
			})
		)
		console.log(`User details: ${userDetails}`)
		res.json({ room, users: userDetails })
	} catch (err) {
		console.error('Error fetching room data:', err)
		res.status(500).json({ error: err.message })
	}
}
