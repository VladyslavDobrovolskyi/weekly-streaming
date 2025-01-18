/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
				const response = await fetch(
					'https://streaming.vladyslavdobrovolskyi.tech/api/room_reservations/user',
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				)
				const data = await response.json()
				if (response.ok) {
					setRoomData(data.room)
					setUsers(data.users)
					setupWebRTC(data.room.room_id)
				} else {
					setError('Failed to fetch room data')
				}
			} catch (error) {
				setError('An error occurred while fetching room data')
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
				signalingSocketRef.current = new WebSocket('wss://streaming.vladyslavdobrovolskyi.tech/ws')

				console.log('Signaling socket created')
				signalingSocketRef.current.onmessage = message => {
					const data = JSON.parse(message.data)
					handleSignalingData(data)
				}
				console.log('Signaling socket message handler set')

				signalingSocketRef.current.onopen = () => {
					signalingSocketRef.current?.send(JSON.stringify({ type: 'join', roomId }))
				}
			} catch (error) {
				if (error instanceof Error) {
					console.log('WEBRTC error:', error.message)
					setError(error.message)
				}
			}
		}

		const handleSignalingData = async (data: any) => {
			switch (data.type) {
				case 'offer':
					await handleOffer(data.offer, data.sender)
					break
				case 'answer':
					await handleAnswer(data.answer, data.sender)
					break
				case 'candidate':
					await handleCandidate(data.candidate, data.sender)
					break
				default:
					break
			}
		}

		const handleOffer = async (offer: RTCSessionDescriptionInit, sender: string) => {
			const peerConnection = createPeerConnection(sender)
			await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
			const answer = await peerConnection.createAnswer()
			await peerConnection.setLocalDescription(answer)
			signalingSocketRef.current?.send(JSON.stringify({ type: 'answer', answer, sender }))
		}

		const handleAnswer = async (answer: RTCSessionDescriptionInit, sender: string) => {
			const peerConnection = peerConnectionsRef.current[sender]
			await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
		}

		const handleCandidate = async (candidate: RTCIceCandidateInit, sender: string) => {
			const peerConnection = peerConnectionsRef.current[sender]
			await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
		}

		const createPeerConnection = (userId: string) => {
			const peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			})

			peerConnection.onicecandidate = event => {
				if (event.candidate) {
					signalingSocketRef.current?.send(
						JSON.stringify({ type: 'candidate', candidate: event.candidate, sender: userId })
					)
				}
			}

			peerConnection.ontrack = _event => {
				// Handle remote stream
			}

			localStreamRef.current?.getTracks().forEach(track => {
				peerConnection.addTrack(track, localStreamRef.current!)
			})

			peerConnectionsRef.current[userId] = peerConnection
			return peerConnection
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
		</div>
	)
}

export default Room
