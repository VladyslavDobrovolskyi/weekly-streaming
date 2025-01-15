import { Request, Response } from 'express'
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../services/userService'

export const getAllUsersHandler = async (req: Request, res: Response) => {
	try {
		const users = await getAllUsers()
		res.json(users)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const getUserByIdHandler = async (req: Request, res: Response) => {
	const { id } = req.params
	try {
		const user = await getUserById(Number(id))
		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}
		res.json(user)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const createUserHandler = async (req: Request, res: Response) => {
	const { username, password, email } = req.body
	try {
		await createUser(username, password, email)
		res.status(201).json({ message: 'User created successfully' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const updateUserHandler = async (req: Request, res: Response) => {
	const { id } = req.params
	const { username, password, email } = req.body
	try {
		await updateUser(Number(id), username, password, email)
		res.status(200).json({ message: 'User updated successfully' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}

export const deleteUserHandler = async (req: Request, res: Response) => {
	const { id } = req.params
	try {
		await deleteUser(Number(id))
		res.status(200).json({ message: 'User deleted successfully' })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
}
