import { Router } from 'express'
import {
	getAllRoomReservationsHandler,
	addRoomReservationHandler,
	deleteRoomReservationHandler,
	getUsersInRoomHandler,
	getRoomData,
	getRoomByUser,
} from '../controllers/roomController'
import { authMiddleware } from '../middlware/authMiddleware'

const router = Router()

//@ts-expect-error ts-typnyak
router.get('/', authMiddleware, getAllRoomReservationsHandler)
//@ts-expect-error ts-typnyak
router.post('/', authMiddleware, addRoomReservationHandler)
//@ts-expect-error ts-typnyak
router.delete('/', authMiddleware, deleteRoomReservationHandler)
//@ts-expect-error ts-typnyak
router.get('/:roomId/users', authMiddleware, getUsersInRoomHandler)
//@ts-expect-error ts-typnyak
router.get('/user', authMiddleware, getRoomByUser) // New route to get room by user ID
//@ts-expect-error ts-typnyak
router.get('/room', authMiddleware, getRoomData)
export default router
