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

export const getRoomByUserIdHandler = async (req: AuthenticatedRequest, res: Response) => {
	const userId = req.user.id // Assuming req.user is set by authMiddleware
	try {
		//@ts-expect-error ts-typnyak
		const room = await getRoomByUserId(userId)
		if (!room) {
			return res.status(404).json({ message: 'Room not found' })
		}
		const users = await getUsersInRoom(room.room_id)
		res.json({ room, users })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
