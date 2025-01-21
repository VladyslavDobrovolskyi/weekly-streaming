import { Router } from 'express'
import {
	getAllUsersHandler,
	getUserByIdHandler,
	createUserHandler,
	updateUserHandler,
	deleteUserHandler,
} from '../controllers/userController.ts'
import { authMiddleware } from '../middlware/authMiddleware.ts'

const router = Router()
//@ts-expect-error ts-typnyak
router.get('/', authMiddleware, getAllUsersHandler)
//@ts-expect-error ts-typnyak
router.get('/:id', authMiddleware, getUserByIdHandler)
//@ts-expect-error ts-typnyak

router.post('/', authMiddleware, createUserHandler)
//@ts-expect-error ts-typnyak

router.put('/:id', authMiddleware, updateUserHandler)
//@ts-expect-error ts-typnyak

router.delete('/:id', authMiddleware, deleteUserHandler)

export default router
