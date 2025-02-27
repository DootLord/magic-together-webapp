import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client' // Import the io function
import './App.css'
import { DefaultEventsMap } from 'socket.io'
import Card from './components/card/Card'
import { Search, SearchIconWrapper, StyledInputBase } from './defaultMuiStyles'
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'motion/react'
import { Button, Snackbar, TextField } from '@mui/material'

interface CardData {
  id: number
  url: string
  name: string
  x: number
  y: number
  locked: boolean
  tapped: boolean
}

export interface IDeckInfo {
  deckName: string;
  date: string;
}

function App() {
  const [cards, setCards] = useState<CardData[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const showSearchRef = useRef(false)
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState('')
  const [deckName, setDeckName] = useState('')
  const [deckList, setDeckList] = useState('') // Decklist for exporting to server
  const [showDeckImport, setShowDeckImport] = useState(false)

  const [showServerDecklist, setShowServerDecklist] = useState(false) // Show the server decklist
  const [serverDecklist, setServerDecklist] = useState<IDeckInfo[]>([]) // List of decks from the server


  // Socket.io
  useEffect(() => {
    const socket = io("localhost:3000", {
      transports: ['websocket'],
      autoConnect: false
    })

    socket.on('connect', () => { console.log('Connected to socket.io server') })
    socket.on('cards', (cards: CardData[]) => { setCards(() => cards) });
    socket.on('disconnect', () => { console.log('Disconnected from socket.io server') })
    socket.on('connect_error', (err: any) => { console.error('Connection error:', err) })
    socket.on('error', (err: any) => { setOpenSnackbar(err) });
    socket.on('decks', (decks: IDeckInfo[]) => { console.log(JSON.stringify(decks)); setServerDecklist(decks) })

    socket.connect()

    socketRef.current = socket

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showSearchRef.current) return; // If we're typing, ignore event keypresses

      // E - Generate new card
      if (event.key === 'e') {
        generateNewCard()
      }

      // R - Clear all cards
      if (event.key === 'r') {
        clearCards()
      }

      // D - Show deck import
      if (event.key === 'd') {
        setShowDeckImport((prev) => !prev)
      }

      // S - Show server decklist
      if (event.key === 's') {
        socket.emit('getDecks')
        setShowServerDecklist((prev) => !prev)
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

  function handleDeckSubmit() {
    socketRef.current?.emit('newDeck', { deckName, deckList })
    setDeckName('')
    setDeckList('')
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

      <motion.div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxHeight: '70vh',
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          padding: '20px',
          borderRadius: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '16px'
        }}
        initial={{ opacity: 0 }}
        animate={showServerDecklist ? { opacity: 1 } : { display: "none", opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {serverDecklist.map((deck, index) => (
          <motion.div
            key={index}
            style={{
              backgroundColor: '#2d2d2d',
              padding: '16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <h3 style={{ color: '#fff', margin: 0 }}>{deck.deckName}</h3>
            <p style={{ color: '#888', margin: '8px 0 0 0' }}>
                {new Date(deck.date).toLocaleString()}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: '300px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: showDeckImport ? 1 : 0 }}
      >
        <TextField
          fullWidth
          margin="normal"
          label="Deck Name"
          value={deckName}
          onChange={(e) => setDeckName(e.target.value)}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Paste deck list here..."
          multiline
          rows={10}
          value={deckList}
          onChange={(e) => setDeckList(e.target.value)}
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleDeckSubmit}
          sx={{ mt: 2 }}
        >
          Import Deck
        </Button>
      </motion.div>


        <div style={{
          position: 'fixed',
          bottom: 10,
          left: 10,
          color: 'white',
          opacity: 0.3,
          fontSize: '0.8rem'
        }}>
          Hotkeys: [E] Add Card | [R] Reset | [D] Deck Import | [S] Saved Decks
        </div>

    </div>

  )
}

export default App
