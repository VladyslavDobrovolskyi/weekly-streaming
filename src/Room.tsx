import React, { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'
import Peer from 'peerjs'

interface RoomData {
	room_id: string
	user_id: string
}

interface UserData {
	username: string
	active: boolean
}

const Room: React.FC = () => {
	const [roomData, setRoomData] = useState<RoomData | null>(null)
	const [users, setUsers] = useState<UserData[]>([])
	const [error, setError] = useState<string | null>(null)
	const [message, setMessage] = useState<string>('')
	const [receivedMessages, setReceivedMessages] = useState<string[]>([])
	const signalingSocketRef = useRef<ReturnType<typeof io> | null>(null)
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerRef = useRef<Peer | null>(null)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const peerListRef = useRef<{ [key: string]: RTCPeerConnection }>({})

	useEffect(() => {
		const fetchRoomData = async () => {
			try {
				const token = localStorage.getItem('token')
				if (!token) {
					throw new Error('Token not found')
				}

				const response = await fetch(
					'https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations/user',
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				)

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const data = await response.json()
				setRoomData(data.room)
				setupSocket(data.room.room_id, data.room.user_id)
				await setupLocalStream()
				initPeer(data.room.user_id)
			} catch (error) {
				if (error instanceof Error) {
					setError(error.message)
				}
			}
		}

		const setupLocalStream = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
				localStreamRef.current = stream
			} catch (error) {
				console.error('Error obtaining local stream:', error)
			}
		}

		const setupSocket = (roomId: string, username: string) => {
			signalingSocketRef.current = io('https://streaming.vladyslavdobrovolskyi.tech/socket.io', {
				transports: ['websocket'],
				path: '/socket.io',
			})

			signalingSocketRef.current.on('connect', () => {
				signalingSocketRef.current?.emit('join', { roomId, username })
			})

			signalingSocketRef.current.on('users', users => {
				setUsers(users.map((user: UserData) => ({ ...user, active: false })))
			})

			signalingSocketRef.current.on('message', data => {
				setReceivedMessages(prevMessages => [...prevMessages, `${data.user}: ${data.message}`])
			})

			signalingSocketRef.current.on('webrtc-offer', async data => {
				const peerConnection = createPeerConnection(data.from)
				await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
				const answer = await peerConnection.createAnswer()
				await peerConnection.setLocalDescription(answer)
				signalingSocketRef.current?.emit('webrtc-answer', { to: data.from, answer })
			})
		}

		const initPeer = (userId: string) => {
			peerRef.current = new Peer(userId)
			peerRef.current.on('open', id => {
				console.log(`${id} connected`)
			})
		}

		const createPeerConnection = (userId: string) => {
			const peerConnection = new RTCPeerConnection()
			peerConnection.onicecandidate = event => {
				if (event.candidate) {
					signalingSocketRef.current?.emit('webrtc-ice-candidate', {
						to: userId,
						candidate: event.candidate,
					})
				}
			}
			peerConnection.ontrack = event => {
				addRemoteAudio(event.streams[0], userId)
			}
			localStreamRef.current?.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStreamRef.current!)
			})
			return peerConnection
		}

		const addRemoteAudio = (stream: MediaStream, userId: string) => {
			const audioContext = new AudioContext()
			const analyser = audioContext.createAnalyser()
			const source = audioContext.createMediaStreamSource(stream)
			source.connect(analyser)

			const dataArray = new Uint8Array(analyser.frequencyBinCount)
			const updateActiveState = () => {
				analyser.getByteFrequencyData(dataArray)
				const isActive = dataArray.some(value => value > 50)
				setUsers(prevUsers =>
					prevUsers.map(user => (user.username === userId ? { ...user, active: isActive } : user))
				)
				requestAnimationFrame(updateActiveState)
			}
			updateActiveState()
		}

		fetchRoomData()
	}, [])

	const sendMessage = () => {
		if (signalingSocketRef.current && roomData) {
			signalingSocketRef.current.emit('message', { roomId: roomData.room_id, message })
			setMessage('')
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
					<li key={index}>
						{user.username} {user.active ? '🎤 Speaking' : '🟢 Online'}
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
