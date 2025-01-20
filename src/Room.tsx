import React, { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

interface RoomData {
	room_id: string
	user_id: string
	// Add more fields as needed
}

interface UserData {
	username: string
}

const Room: React.FC = () => {
	const [roomData, setRoomData] = useState<RoomData | null>(null)
	const [users, setUsers] = useState<UserData[]>([])
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string>('')
	const [receivedMessages, setReceivedMessages] = useState<string[]>([])
	const signalingSocketRef = useRef<ReturnType<typeof io> | null>(null)

	useEffect(() => {
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
				setupSocket(data.room.room_id, data.room.user_id)
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error fetching room data:', error.message)
					setError(error.message)
				}
			}
		}

		const setupSocket = (roomId: string, username: string) => {
			console.log('Setting up socket...')
			signalingSocketRef.current = io('https://streaming.vladyslavdobrovolskyi.tech/socket.io', {
				transports: ['websocket'], // Use WebSocket instead of polling
				path: '/socket.io',
			})
			console.log('Signaling socket created')

			signalingSocketRef.current.on('connect', () => {
				signalingSocketRef.current?.emit('join', { roomId, username })
				console.log('Join event emitted for room:', roomId)
			})

			signalingSocketRef.current.on('users', users => {
				console.log('Received users from server:', users)
				setUsers(users)
			})

			signalingSocketRef.current.on('message', data => {
				console.log('Received message from server:', data)
				setReceivedMessages(prevMessages => [...prevMessages, `${data.user}: ${data.message}`])
			})

			signalingSocketRef.current.on('disconnect', () => {
				console.log('Socket disconnected')
			})

			signalingSocketRef.current.on('error', error => {
				console.error('Socket error:', error)
			})
		}

		fetchRoomData()
	}, [])

	const sendMessage = () => {
		if (signalingSocketRef.current && roomData) {
			console.log('Sending message:', message)
			signalingSocketRef.current.emit('message', { roomId: roomData.room_id, message })
			console.log('Message sent:', message)
			setReceivedMessages(prevMessages => [...prevMessages, `You: ${message}`])
			setMessage('') // Clear the input field
		}
	}

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
				{users.map((user, index) => (
					<li key={index}>{user.username}</li>
				))}
			</ul>

			<h2>Chat</h2>
			<div style={{ border: '1px solid #ccc', padding: '10px', height: '200px', overflowY: 'scroll' }}>
				{receivedMessages.map((msg, index) => (
					<p key={index}>{msg}</p>
				))}
			</div>

			<input
				type='text'
				value={message}
				onChange={e => setMessage(e.target.value)}
				placeholder='Enter your message'
			/>
			<button onClick={sendMessage}>Send Message</button>
		</div>
	)
}

export default Room
