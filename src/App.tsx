import React, { useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'
import Hls from 'hls.js'

const App: React.FC = () => {
	const playerRef = useRef<ReactPlayer>(null)

	useEffect(() => {
		if (Hls.isSupported() && playerRef.current) {
			const hls = new Hls({
				liveSyncDurationCount: 1, // Синхронизация с текущим моментом
				maxLiveSyncPlaybackRate: 1.5, // Автокоррекция скорости для "живого" момента
			})

			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement

			if (mediaElement) {
				hls.loadSource('http://92.112.180.234/stream/playlist.m3u8')
				hls.attachMedia(mediaElement)

				// Событие для автоматического воспроизведения
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					mediaElement.play().catch(error => console.error('Playback error:', error))
				})

				return () => {
					hls.destroy()
				}
			}
		}
	}, [])

	return (
		<div className='App'>
			<h1>CI-CD TESTER</h1>
			<ReactPlayer
				ref={playerRef}
				url='http://92.112.180.234/stream/playlist.m3u8'
				playing={true}
				controls={true}
				muted={false}
				loop={true} // Цикл воспроизведения (на случай прерывания)
				width='100%'
				height='auto'
				config={{
					file: {
						attributes: {
							crossOrigin: 'anonymous',
						},
						hlsOptions: {
							liveSyncDurationCount: 1,
							maxLiveSyncPlaybackRate: 1.5,
						},
					},
				}}
			/>
		</div>
	)
}

export default App
