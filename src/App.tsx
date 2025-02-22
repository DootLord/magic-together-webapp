import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client' // Import the io function
import './App.css'
import { DefaultEventsMap } from 'socket.io'
import Card from './components/card/Card'

interface CardData {
  id: number
  url: string
  name: string
  x: number
  y: number
  locked: boolean
}

function App() {
  const [cards, setCards] = useState<CardData[]>([])
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)

  // Socket.io
  useEffect(() => {
    const socket = io({
      transports: ['websocket'],
      autoConnect: false
    }) // Replace with your server URL

    socket.on('connect', () => {
      console.log('Connected to socket.io server')
    })

    socket.on('cards', (cards: CardData[]) => {
      console.log('Received cards:', cards)
      setCards(() => cards)
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket.io server')
    })

    socket.connect()

    socket.on('connect_error', (err: any) => {
      console.error('Connection error:', err)
    })

    socketRef.current = socket

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'e') {
        generateNewCard()
      }
    }

    window.addEventListener('keypress', handleKeyPress)

    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      socket.disconnect()
    }
  }, [])

  function generateNewCard() {
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('newCard')
  }

  function handleCardPositionChange(index: number, x: number, y: number) {
    console.log(`Card ${index} position changed to (${x}, ${y})`)
    setCards((prevCards) => {
      const newCards = prevCards.map((card) => {
        if (card.id === index) {
          return { ...card, x, y }
        }
        return card
      })
      return newCards
    })

    // Emit the new card position to the server
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('cardPositionChange', { index, x, y })
  }

  return (
    <div id="play-area">
      {cards.map((card, index) => (
        <Card
          key={index}
          url={card.url}
          x={card.x}
          y={card.y}
          onPositionChange={(x: number, y: number) => handleCardPositionChange(index, x, y)}
        />
      ))}
    </div>

  )
}

export default App
