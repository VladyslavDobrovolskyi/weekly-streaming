import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const secretKey = 'SM!@#^SECR*@#&18ET_-(JK_eY' // Use a secure key in production

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const token = req.header('Authorization')?.replace('Bearer ', '')

	if (!token) {
		return res.status(401).json({ message: 'No token, authorization denied' })
	}

	try {
		const decoded = jwt.verify(token, secretKey)
		//@ts-expect-error ts-typnyak
		req.user = decoded
		next()
	} catch {
		res.status(401).json({ message: 'Token is not valid' })
	}
}
