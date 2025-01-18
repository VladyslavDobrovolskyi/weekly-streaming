import React, { useEffect, useState, useRef } from 'react'

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
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({})
	const signalingSocketRef = useRef<WebSocket | null>(null)

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
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				)

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`)
				}

				const data = await response.json()
				setRoomData(data.room)
				setUsers(data.users)
				setupWebRTC(data.room.room_id)
			} catch (error) {
				if (error instanceof Error) {
					console.error('Error fetching room data:', error.message)
					setError(error.message)
				}
			}
		}

		const setupWebRTC = async (roomId: string) => {
			try {
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					throw new Error('WebRTC is not supported in this browser')
				}

				const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
				localStreamRef.current = localStream
				console.log('Local stream created')

				const peerConnection = new RTCPeerConnection({
					iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
				})

				peerConnection.onicecandidate = event => {
					if (event.candidate) {
						signalingSocketRef.current?.send(
							JSON.stringify({
								type: 'signal',
								room: roomId,
								desc: { type: 'candidate', candidate: event.candidate },
							})
						)
						console.log('Sent candidate:', event.candidate)
					}
				}

				peerConnection.ontrack = () => {
					// Handle remote stream
				}

				localStream.getTracks().forEach(track => {
					peerConnection.addTrack(track, localStream)
				})

				peerConnectionsRef.current[roomId] = peerConnection

				signalingSocketRef.current = new WebSocket('wss://streaming.vladyslavdobrovolskyi.tech/ws')
				console.log('Signaling socket created')

				signalingSocketRef.current.onmessage = message => {
					const data = JSON.parse(message.data)
					handleSignalingData(data)
				}
				console.log('Signaling socket message handler set')

				signalingSocketRef.current.onopen = () => {
					signalingSocketRef.current?.send(JSON.stringify({ type: 'join', roomId }))
					console.log('Join event emitted for room:', roomId)
				}
			} catch (error) {
				if (error instanceof Error) {
					console.log('WEBRTC error:', error.message)
					setError(error.message)
				}
			}
		}

		const handleSignalingData = async (data: {
			desc: RTCSessionDescriptionInit | { type: 'candidate'; candidate: RTCIceCandidateInit }
		}) => {
			const peerConnection = peerConnectionsRef.current[roomData?.room_id || '']
			if (!peerConnection) return

			switch (data.desc.type) {
				case 'offer': {
					await peerConnection.setRemoteDescription(new RTCSessionDescription(data.desc))
					const answer = await peerConnection.createAnswer()
					await peerConnection.setLocalDescription(answer)
					signalingSocketRef.current?.send(
						JSON.stringify({ type: 'signal', room: roomData?.room_id, desc: answer })
					)
					break
				}
				case 'answer':
					await peerConnection.setRemoteDescription(new RTCSessionDescription(data.desc))
					break
				case 'candidate':
					await peerConnection.addIceCandidate(new RTCIceCandidate(data.desc.candidate))
					break
				default:
					break
			}
		}

		fetchRoomData()
	}, [roomData?.room_id])

	const createOffer = async () => {
		try {
			console.log('Create offer')
			const peerConnection = peerConnectionsRef.current[roomData?.room_id || '']
			if (!peerConnection) {
				console.warn('No peer connection found')
				return
			}

			const offer = await peerConnection.createOffer()
			await peerConnection.setLocalDescription(offer)
			console.log('Offer created and set as local description:', offer)

			signalingSocketRef.current?.send(JSON.stringify({ type: 'signal', room: roomData?.room_id, desc: offer }))
			console.log('Offer sent to signaling server')
		} catch (error) {
			console.error('Error creating offer:', error)
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
				{users.map(user => (
					<li key={user.id}>
						{user.username} ({user.email})
					</li>
				))}
			</ul>
			<button onClick={createOffer}>Create Offer</button>
		</div>
	)
}

export default Room
