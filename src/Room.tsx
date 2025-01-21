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
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [receivedMessages, setReceivedMessages] = useState<string[]>([])
	const signalingSocketRef = useRef<ReturnType<typeof io> | null>(null)
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerRef = useRef<Peer | null>(null)
	const peerListRef = useRef<{ [key: string]: RTCPeerConnection }>({})

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
				setupSocket(data.room.room_id, data.room.user_id)
				await setupLocalStream()
				initPeer(data.room.user_id)
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error fetching room data:', error.message)
					setError(error.message)
				}
			}
		}

		const setupLocalStream = async () => {
			try {
				console.log('Setting up local stream...')
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
				localStreamRef.current = stream
				console.log('Local stream obtained')
			} catch (error) {
				console.error('Error obtaining local stream:', error)
			}
		}

		const setupSocket = (roomId: string, username: string) => {
			console.log('Setting up socket...')
			signalingSocketRef.current = io('https://streaming.vladyslavdobrovolskyi.tech/socket.io', {
				transports: ['websocket'], // Use WebSocket instead of polling
				path: '/socket.io',
			})

			signalingSocketRef.current.on('connect', () => {
				console.log('Socket connected')
				signalingSocketRef.current?.emit('join', { roomId, username })
				console.log('Join event emitted for room:', roomId)
			})

			signalingSocketRef.current.on('users', async (users: UserData[]) => {
				console.log('Received users:', users)
				setUsers(users.map(user => ({ ...user, active: false })))

				// Создаем соединения WebRTC для каждого пользователя
				users.forEach(user => {
					if (user.username !== username && !peerListRef.current[user.username]) {
						createPeerConnection(user.username)
					}
				})
			})

			signalingSocketRef.current.on('webrtc-offer', async data => {
				console.log('Received WebRTC offer:', data)
				const peerConnection = createPeerConnection(data.from)
				await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
				const answer = await peerConnection.createAnswer()
				await peerConnection.setLocalDescription(answer)

				signalingSocketRef.current?.emit('webrtc-answer', { to: data.from, answer })
			})

			signalingSocketRef.current.on('webrtc-answer', async data => {
				console.log('Received WebRTC answer:', data)
				const peerConnection = peerListRef.current[data.from]
				if (peerConnection) {
					await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
				}
			})

			signalingSocketRef.current.on('webrtc-ice-candidate', data => {
				console.log('Received ICE candidate:', data)
				const peerConnection = peerListRef.current[data.from]
				if (peerConnection) {
					peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
				}
			})

			signalingSocketRef.current.on('disconnect', () => {
				console.log('Socket disconnected')
			})
		}

		const initPeer = (userId: string) => {
			console.log('Initializing peer...')
			peerRef.current = new Peer(userId)
			peerRef.current.on('open', id => {
				console.log(`${id} connected`)
			})

			listenToCall()
		}

		const listenToCall = () => {
			console.log('Listening to calls...')
			peerRef.current?.on('call', call => {
				console.log('Received call:', call)
				navigator.mediaDevices
					.getUserMedia({ audio: true, video: false })
					.then(stream => {
						localStreamRef.current = stream
						call.answer(stream)
						call.on('stream', remoteStream => {
							console.log('Received remote stream:', remoteStream)
							if (!peerListRef.current[call.peer]) {
								addRemoteAudio(remoteStream, call.peer)
								peerListRef.current[call.peer] = call.peerConnection
							}
						})
					})
					.catch(err => {
						console.log('Unable to connect because ' + err)
					})
			})
		}

		const createPeerConnection = (userId: string) => {
			console.log('Creating peer connection for:', userId)
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
				console.log('Received remote track:', event.streams[0])
				addRemoteAudio(event.streams[0], userId)
			}

			localStreamRef.current?.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStreamRef.current!)
			})

			peerListRef.current[userId] = peerConnection

			// Отправляем offer новому пользователю
			peerConnection.createOffer().then(offer => {
				peerConnection.setLocalDescription(offer)
				signalingSocketRef.current?.emit('webrtc-offer', { to: userId, offer })
			})

			return peerConnection
		}

		const addRemoteAudio = (stream: MediaStream, userId: string) => {
			console.log('Adding remote audio for:', userId)
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
			console.log('Sending message:', message)
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
