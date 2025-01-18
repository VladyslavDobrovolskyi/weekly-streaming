import React, { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

interface RoomData {
	room_id: string
	user_id: string
}

interface UserData {
	id: string
	username: string
	email: string
}

const Room: React.FC = () => {
	const [roomData, setRoomData] = useState<RoomData | null>(null)
	const [users, setUsers] = useState<UserData[]>([])
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string>('')
	const [receivedMessages, setReceivedMessages] = useState<string[]>([])

	// Сохраняем сокет в useRef или useState, чтобы не создавать новый при каждом рендере
	const [socket, setSocket] = useState<typeof Socket | null>(null)

	useEffect(() => {
		// Подключение к namespace '/socket.io'
		const newSocket = io('https://streaming.vladyslavdobrovolskyi.tech/socket.io', {
			transports: ['websocket'],
		})

		setSocket(newSocket)

		// Логирование успешного подключения
		newSocket.on('connect', () => {
			console.log(`Connected to /socket.io with ID: ${newSocket.id}`)
		})

		// Обработчик ответа от сервера
		newSocket.on('hello', (msg: string) => {
			console.log('Server says:', msg)
			setReceivedMessages(prevMessages => [...prevMessages, `Server: ${msg}`])
		})

		// Обработка полученных сообщений
		newSocket.on('message', (msg: string) => {
			console.log('New message:', msg)
			setReceivedMessages(prevMessages => [...prevMessages, `User: ${msg}`])
		})

		// Отправляем сообщение серверу после подключения
		newSocket.emit('howdy', 'Hello from client!')

		// Очистка сокета при размонтировании
		return () => {
			newSocket.disconnect()
			console.log('Socket disconnected')
		}
	}, [])

	// Функция для отправки сообщения
	const sendMessage = () => {
		if (socket && message.trim() !== '') {
			socket.emit('message', message)
			setReceivedMessages(prevMessages => [...prevMessages, `You: ${message}`])
			setMessage('') // Очистка поля ввода
		}
	}

	// Получение данных о комнате
	useEffect(() => {
		const fetchRoomData = async () => {
			try {
				console.log('Fetching room data...')
				const token = localStorage.getItem('token')
				if (!token) throw new Error('Token not found')

				const response = await fetch(
					'https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations/user',
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				)

				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

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

	if (error) return <div>{error}</div>
	if (!roomData) return <div>Loading...</div>

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
