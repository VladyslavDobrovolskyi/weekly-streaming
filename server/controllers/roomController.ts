import { Request, Response } from 'express'
import { getAllRoomReservations, addRoomReservation, deleteRoomReservation } from '../services/roomService'

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
		res.status(201).json({ message: 'User added to the room' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const deleteRoomReservationHandler = async (req: Request, res: Response) => {
	const { room_id, user_id } = req.body
	try {
		await deleteRoomReservation(room_id, user_id)
		res.status(200).json({ message: 'User removed from the room' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
