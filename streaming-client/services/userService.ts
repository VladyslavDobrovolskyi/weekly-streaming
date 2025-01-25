import db from '../db/database-connection'

export const getAllUsers = async () => {
	const result = await db.query('SELECT * FROM users')
	return result.rows
}

export const getUserById = async (id: number) => {
	const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
	return result.rows[0]
}

export const getUserByUsername = async (username: string) => {
	const result = await db.query('SELECT * FROM users WHERE username = $1', [username])
	return result.rows[0]
}

export const createUser = async (username: string, password: string, email: string) => {
	await db.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3)', [username, password, email])
}

export const updateUser = async (id: number, username: string, password: string, email: string) => {
	await db.query('UPDATE users SET username = $1, password = $2, email = $3 WHERE id = $4', [
		username,
		password,
		email,
		id,
	])
}

export const deleteUser = async (id: number) => {
	await db.query('DELETE FROM users WHERE id = $1', [id])
}
