import db from '../db/database-connection'

export const getAllRoomReservations = async () => {
	const result = await db.query('SELECT * FROM room_reservations')
	return result.rows
}

export const addRoomReservation = async (room_id: number, user_id: number) => {
	const roomResult = await db.query('SELECT available_seats FROM rooms WHERE id = $1', [room_id])
	if (roomResult.rows.length === 0) {
		throw new Error('Room not found')
	}

	const availableSeats = roomResult.rows[0].available_seats
	if (availableSeats <= 0) {
		throw new Error('No available seats in the room')
	}

	await db.query('INSERT INTO room_reservations (room_id, user_id) VALUES ($1, $2)', [room_id, user_id])
	await db.query('UPDATE rooms SET available_seats = available_seats - 1 WHERE id = $1', [room_id])
}

export const deleteRoomReservation = async (room_id: number, user_id: number) => {
	const reservationResult = await db.query('SELECT id FROM room_reservations WHERE room_id = $1 AND user_id = $2', [
		room_id,
		user_id,
	])
	if (reservationResult.rows.length === 0) {
		throw new Error('Reservation not found')
	}

	await db.query('DELETE FROM room_reservations WHERE room_id = $1 AND user_id = $2', [room_id, user_id])
	await db.query('UPDATE rooms SET available_seats = available_seats + 1 WHERE id = $1', [room_id])
}
