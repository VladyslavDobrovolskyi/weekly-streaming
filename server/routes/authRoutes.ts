import express from 'express'
import jwt from 'jsonwebtoken'
// import bcrypt from 'bcryptjs'
import { getUserByUsername } from '../services/userService.ts'

const router = express.Router()
const secretKey = 'your_secret_key' // Use a secure key in production

//@ts-expect-error ts-typnyak
router.post('/login', async (req, res) => {
	const { username, password } = req.body

	try {
		const user = await getUserByUsername(username)
		if (!user) {
			return res.status(401).json({ message: 'Invalid username or password' })
		}

		// const isMatch = await bcrypt.compare(password, user.password)
		const isMatch = password === user.password
		if (!isMatch) {
			return res.status(401).json({ message: 'Invalid username or password' })
		}

		const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' })
		res.json({ token })
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

export default router
