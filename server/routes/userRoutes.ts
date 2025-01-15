import { Router } from 'express'
import {
	getAllUsersHandler,
	getUserByIdHandler,
	createUserHandler,
	updateUserHandler,
	deleteUserHandler,
} from '../controllers/userController'

const router = Router()

router.get('/', getAllUsersHandler)
//@ts-expect-error ts-typnyak
router.get('/:id', getUserByIdHandler)
router.post('/', createUserHandler)
router.put('/:id', updateUserHandler)
router.delete('/:id', deleteUserHandler)

export default router
