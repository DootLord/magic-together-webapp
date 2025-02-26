import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client' // Import the io function
import './App.css'
import { DefaultEventsMap } from 'socket.io'
import Card from './components/card/Card'
import { Search, SearchIconWrapper, StyledInputBase } from './defaultMuiStyles'
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'motion/react'
import { Snackbar } from '@mui/material'

interface CardData {
  id: number
  url: string
  name: string
  x: number
  y: number
  locked: boolean
  tapped: boolean
}

function App() {
  const [cards, setCards] = useState<CardData[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const showSearchRef = useRef(false)
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState('')

  // Socket.io
  useEffect(() => {
    const socket = io("wss://magic-together-sockets.dootlord.meme", {
      transports: ['websocket'],
      autoConnect: false
    })

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

    socket.on('error', (err: any) => {
      setOpenSnackbar(err)
    });

    socketRef.current = socket

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showSearchRef.current) return; // If we're typing, ignore event keypresses

      if (event.key === 'e') {
        generateNewCard()
      }

      if (event.key === 'r') {
        clearCards()
      }
    }

    window.addEventListener('keypress', handleKeyPress)

    return () => {
      window.removeEventListener('keypress', handleKeyPress)
      socket.disconnect()
    }
  }, [])

  // Keep ref in sync with state
  useEffect(() => {
    showSearchRef.current = showSearch
  }, [showSearch])

  function generateRandomCard() {
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('newCard')
  }

  function generateNewCard() {
    if (!socketRef.current) return // No socket, no service!

    // We already have the search open, they want a random card. Close the search and generate a random card
    if (showSearchRef.current) {
      generateRandomCard()
      setShowSearch(false)
      return
    }

    setShowSearch(true)
  }

  function clearCards() {
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('clear')
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

  function handleTap(index: number) {
    socketRef.current?.emit('tap', { index })
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchInput(event.target.value)
  }

  function handleSearchKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && searchInput.trim()) {
      console.log('Searching for:', searchInput)
      // Emit search to socket
      socketRef.current?.emit('newCard', { name: searchInput })
      setSearchInput('')
      setShowSearch(false)
    }
  }

  function handleCloseSnackbar() {
    setOpenSnackbar('')
  }

  return (
    <div id="play-area">
      {cards.map((card, index) => (
        <Card
          key={index}
          url={card.url}
          x={card.x}
          y={card.y}
          tapped={card.tapped}
          onPositionChange={(x: number, y: number) => handleCardPositionChange(index, x, y)}
          onTap={() => handleTap(index)}
        />
      ))}

      <motion.div
        id="search-container"
        initial={{ scale: 0 }}
        animate={{ scale: showSearch ? 1 : 0 }}
      >
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search for card..."
            inputProps={{ 'aria-label': 'search' }}
            value={searchInput}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyPress}
          />
        </Search>
      </motion.div>

      <Snackbar
        open={!!openSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        message={openSnackbar}
      />
    </div>

  )
}

export default App
