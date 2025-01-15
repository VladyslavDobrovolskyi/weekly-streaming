import React, { useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import Hls from 'hls.js'

const App: React.FC = () => {
	const playerRef = useRef<ReactPlayer>(null)
	const [isPlaying, setIsPlaying] = useState(true)
	const [isMuted, setIsMuted] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const hlsRef = useRef<Hls | null>(null)

	useEffect(() => {
		const checkStreamAvailability = async () => {
			try {
				const response = await fetch('http://92.112.180.234/stream/playlist.m3u8')
				if (!response.ok) {
					if (response.status === 404) {
						setError('Stream will be available at 8 PM')
					} else {
						setError('An error occurred while fetching the stream')
					}
					return
				}

				if (Hls.isSupported() && playerRef.current) {
					const hls = new Hls({
						liveSyncDurationCount: 1,
						lowLatencyMode: true,
						maxLiveSyncPlaybackRate: 1,
						enableWorker: true,
						liveBackBufferLength: 0,
					})
					hlsRef.current = hls

					const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement

					if (mediaElement) {
						hls.loadSource('http://92.112.180.234/stream/playlist.m3u8')
						hls.attachMedia(mediaElement)
						hls.on(Hls.Events.MANIFEST_PARSED, () => {
							mediaElement.play().catch(error => console.error('Playback error:', error))
							setIsPlaying(true)
						})
						//@ts-expect-error event warning
						hls.on(Hls.Events.ERROR, (event, data) => {
							if (data.response && data.response.code === 404) {
								setError('Stream will be available at 8 PM')
							}
						})

						return () => hls.destroy()
					}
				}
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (error) {
				setError('An error occurred while fetching the stream')
			}
		}

		checkStreamAvailability()
	}, [])

	const handlePlayPause = () => {
		if (playerRef.current) {
			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement
			if (mediaElement.paused) {
				if (hlsRef.current) {
					hlsRef.current.startLoad(-1) // Загрузить последний сегмент
				}
				mediaElement.play().catch(error => console.error('Play error:', error))
				setIsPlaying(true)
			} else {
				if (hlsRef.current) {
					hlsRef.current.stopLoad() // Остановить загрузку сегментов
				}
				mediaElement.pause()
				setIsPlaying(false)
			}
		}
	}

	const handleMuteUnmute = () => {
		if (playerRef.current) {
			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement
			mediaElement.muted = !mediaElement.muted
			setIsMuted(mediaElement.muted)
		}
	}

	if (error) {
		return (
			<div className='App'>
				<h1>{error}</h1>
			</div>
		)
	}

	return (
		<div className='App'>
			<h1>Live Stream!!!</h1>
			<ReactPlayer
				ref={playerRef}
				url='http://92.112.180.234/stream/playlist.m3u8'
				playing={isPlaying}
				controls={false}
				muted={isMuted}
				loop={true}
				width='100%'
				height='auto'
				config={{
					file: {
						attributes: {
							crossOrigin: 'anonymous',
						},
						hlsOptions: {
							liveSyncDurationCount: 1,
							lowLatencyMode: true,
							maxLiveSyncPlaybackRate: 1,
							enableWorker: true,
							liveBackBufferLength: 0,
							startPosition: -1,
						},
					},
				}}
			/>
			<div style={{ marginTop: '10px' }}>
				<button onClick={handlePlayPause} style={{ padding: '10px 20px', fontSize: '16px' }}>
					{isPlaying ? 'Pause' : 'Play'}
				</button>
				<button
					onClick={handleMuteUnmute}
					style={{ padding: '10px 20px', fontSize: '16px', marginLeft: '10px' }}
				>
					{isMuted ? 'Unmute' : 'Mute'}
				</button>
			</div>
		</div>
	)
}

export default App
