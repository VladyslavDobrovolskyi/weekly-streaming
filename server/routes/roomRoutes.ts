import { Router } from 'express'
import {
	getAllRoomReservationsHandler,
	addRoomReservationHandler,
	deleteRoomReservationHandler,
	getUsersInRoomHandler,
} from '../controllers/roomController'
import { authMiddleware } from '../middlware/authMiddleware'

const router = Router()
//@ts-expect-error  ts-typnyak
router.get('/', authMiddleware, getAllRoomReservationsHandler)
//@ts-expect-error  ts-typnyak

router.post('/', authMiddleware, addRoomReservationHandler)
//@ts-expect-error  ts-typnyak

router.delete('/', authMiddleware, deleteRoomReservationHandler)
//@ts-expect-error  ts-typnyak

router.get('/:roomId/users', authMiddleware, getUsersInRoomHandler)

export default router
