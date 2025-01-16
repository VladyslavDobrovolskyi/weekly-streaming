import React, { useEffect, useState } from 'react'

const Room: React.FC = () => {
	interface RoomData {
		room_id: string
		user_id: string
		// Add more fields as needed
	}

	const [roomData, setRoomData] = useState<RoomData | null>(null)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const fetchRoomData = async () => {
			try {
				const token = localStorage.getItem('token')
				const response = await fetch('http://92.112.180.234/api/room_reservations', {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const data = await response.json()
				if (response.ok) {
					setRoomData(data)
				} else {
					setError(data.message)
				}
			} catch {
				setError('An error occurred while fetching room data')
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
			{/* Add more room details as needed */}
		</div>
	)
}

export default Room
