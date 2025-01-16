import { Request, Response } from 'express'
import {
	getAllRoomReservations,
	addRoomReservation,
	deleteRoomReservation,
	getUsersInRoom,
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
