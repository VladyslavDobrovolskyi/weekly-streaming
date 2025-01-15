import { Router } from 'express'
import {
	getAllRoomReservationsHandler,
	addRoomReservationHandler,
	deleteRoomReservationHandler,
} from '../controllers/roomController'

const router = Router()

router.get('/', getAllRoomReservationsHandler)
router.post('/', addRoomReservationHandler)
router.delete('/', deleteRoomReservationHandler)

export default router
