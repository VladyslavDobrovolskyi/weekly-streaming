import express from 'express'
import path from 'path'

const app = express()
const port = 5000 // Используем порт 5000 для Express

// Статический сервер для отдачи файлов HLS
app.use('/stream', express.static(path.join(__dirname, '../stream')))

// Запуск сервера
app.listen(port, () => {
	console.log(`HLS server is running at http://localhost:${port}`)
})
