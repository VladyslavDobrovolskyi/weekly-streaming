import React, { useEffect, useState, useRef } from 'react'
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
	const localStreamRef = useRef<MediaStream | null>(null)
	const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({})
	const signalingSocketRef = useRef<ReturnType<typeof io> | null>(null)

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
						signalingSocketRef.current?.emit('message', { type: 'candidate', candidate: event.candidate })
					}
				}

				peerConnection.ontrack = () => {
					// Handle remote stream
				}

				localStream.getTracks().forEach(track => {
					peerConnection.addTrack(track, localStream)
				})

				peerConnectionsRef.current[roomId] = peerConnection

				signalingSocketRef.current = io('https://streaming.vladyslavdobrovolskyi.tech/ws')
				console.log('Signaling socket created')

				signalingSocketRef.current.on('message', data => {
					handleSignalingData(data)
				})
				console.log('Signaling socket message handler set')

				signalingSocketRef.current.emit('message', { type: 'join', roomId })
			} catch (error) {
				if (error instanceof Error) {
					console.log('WEBRTC error:', error.message)
					setError(error.message)
				}
			}
		}

		const handleSignalingData = async (data: {
			type: string
			offer?: RTCSessionDescriptionInit
			answer?: RTCSessionDescriptionInit
			candidate?: RTCIceCandidateInit
		}) => {
			const peerConnection = peerConnectionsRef.current[roomData?.room_id || '']
			if (!peerConnection) return

			switch (data.type) {
				case 'offer':
					{
						if (data.offer) {
							await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
						}
						const answer = await peerConnection.createAnswer()
						await peerConnection.setLocalDescription(answer)
						signalingSocketRef.current?.emit('message', { type: 'answer', answer })
					}
					break
				case 'answer':
					if (data.answer) {
						await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
					}
					break
				case 'candidate':
					await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
					break
				default:
					break
			}
		}

		fetchRoomData()
	}, [roomData?.room_id])

	if (error) {
		return <div>{error}</div>
	}

	if (!roomData) {
		return <div>Loading...</div>
	}

	const createOffer = async () => {
		const peerConnection = peerConnectionsRef.current[roomData?.room_id || '']
		if (!peerConnection) return

		const offer = await peerConnection.createOffer()
		await peerConnection.setLocalDescription(offer)
		signalingSocketRef.current?.emit('message', { type: 'offer', offer })
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
