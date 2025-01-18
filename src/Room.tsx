import React, { useEffect, useState } from 'react'
import io from 'socket.io-client'
interface RoomData {
	room_id: string
	user_id: string
	// Add more fields as needed
}

interface UserData {
	id: string
	username: string
	email: string
	// Add more fields as needed
}

const Room: React.FC = () => {
	const [roomData, setRoomData] = useState<RoomData | null>(null)
	const [users, setUsers] = useState<UserData[]>([])
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string>('')

	useEffect(() => {
		const socket = io('https://streaming.vladyslavdobrovolskyi.tech/socket.io', { transports: ['websocket'] })

		socket.on('hello', arg => {
			console.log(arg)
		})
		socket.emit('howdy', 'stranger')

		const fetchRoomData = async () => {
			try {
				console.log('Fetching room data...')
				const token = localStorage.getItem('token')
				if (!token) {
					throw new Error('Token not found')
				}

				const response = await fetch(
					'https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations/user',
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				)

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const data = await response.json()
				console.log('Room data fetched:', data)
				setRoomData(data.room)
				setUsers(data.users)
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error fetching room data:', error.message)
					setError(error.message)
				}
			}
		}

		fetchRoomData()
	}, [])

	if (error) {
		return <div>{error}</div>
	}

	if (!roomData) {
		return <div>Loading...</div>
	}

	return (
		<div>
			<h1>Room</h1>
			<p>Room ID: {roomData.room_id}</p>
			<p>User ID: {roomData.user_id}</p>
			<h2>Users in this room:</h2>
			<ul>
				{users.map(user => (
					<li key={user.id}>
						{user.username} ({user.email})
					</li>
				))}
			</ul>
			<input
				type='text'
				value={message}
				onChange={e => setMessage(e.target.value)}
				placeholder='Enter your message'
			/>
			{/* <button onClick={}>Send Message</button> */}
		</div>
	)
}

export default Room
