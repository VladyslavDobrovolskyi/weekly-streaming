import React, { useEffect, useRef } from 'react'
import ReactPlayer from 'react-player'
import Hls from 'hls.js'

const App: React.FC = () => {
	// Указываем тип на ReactPlayer с ссылкой на HTMLMediaElement
	const playerRef = useRef<ReactPlayer>(null)

	useEffect(() => {
		// Проверяем, поддерживает ли браузер HLS
		if (Hls.isSupported() && playerRef.current) {
			const hls = new Hls()
			// Получаем внутренний HTMLMediaElement
			const mediaElement = playerRef.current.getInternalPlayer() as HTMLMediaElement

			if (mediaElement) {
				// Путь к .m3u8 файлу
				hls.loadSource('http://92.112.180.234/stream/playlist.m3u8')
				hls.attachMedia(mediaElement)

				// Очистка ресурсов при размонтировании
				return () => {
					hls.destroy()
				}
			}
		}
	}, [])

	return (
		<div className='App'>
			<h1>HLS Streaming Example</h1>
			<ReactPlayer
				ref={playerRef}
				url='http://92.112.180.234/stream/playlist.m3u8'
				controls={true}
				width='100%'
				height='auto'
				playing
				config={{
					file: {
						attributes: {
							crossOrigin: 'anonymous',
						},
						hlsOptions: {
							startLevel: -1,
						},
					},
				}}
			/>
		</div>
	)
}

export default App
