import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

const app = express()
const port = 5555

// Получаем путь к текущей директории с использованием import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Настроим CORS
app.use(cors({ origin: 'http://localhost:7777' })) // Разрешаем доступ со всех источников

// Статический сервер для отдачи файлов HLS
app.use('/stream', express.static(path.join(__dirname, '../stream')))

// Запуск сервера
app.listen(port, () => {
	console.log(`HLS server is running at http://localhost:${port}`)
})
