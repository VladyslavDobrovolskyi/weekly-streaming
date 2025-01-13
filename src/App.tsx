import ReactPlayer from 'react-player'

function App() {
	return (
		<div className='App'>
			<h1>HLS Streaming Example</h1>
			<ReactPlayer url='http://localhost:5000/stream/playlist.m3u8' controls={true} width='100%' height='auto' />
		</div>
	)
}

export default App
