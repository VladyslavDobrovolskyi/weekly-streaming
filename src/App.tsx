import React, { useEffect, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import Hls from 'hls.js'

const App: React.FC = () => {
	const playerRef = useRef<ReactPlayer>(null)
	const [isPlaying, setIsPlaying] = useState(true)
	const [isMuted, setIsMuted] = useState(false)

	useEffect(() => {
		if (Hls.isSupported() && playerRef.current) {
			const hls = new Hls({
				liveSyncDurationCount: 1,
				lowLatencyMode: true,
				maxLiveSyncPlaybackRate: 1.5,
			})

			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement

			if (mediaElement) {
				hls.loadSource('http://92.112.180.234/stream/playlist.m3u8')
				hls.attachMedia(mediaElement)
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					mediaElement.play().catch(error => console.error('Playback error:', error))
					setIsPlaying(true)
				})

				return () => hls.destroy()
			}
		}
	}, [])

	const handlePlayPause = () => {
		if (playerRef.current) {
			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement
			if (mediaElement.paused) {
				mediaElement.play().catch(error => console.error('Play error:', error))
				setIsPlaying(true)
			} else {
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
