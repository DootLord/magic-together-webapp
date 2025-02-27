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
  cardCount: number
  deckListIndex: number;
  date: string;
}

function App() {
  // Socket.io
  const socketRef = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null) // Ref to keep socket in scope

  // Board State
  const [cards, setCards] = useState<CardData[]>([]) // Array of cards on the board.

  // Search State
  const [showSearch, setShowSearch] = useState(false) // Show the search bar
  const showSearchRef = useRef(false) // Ref to keep in sync with state (Used programmatically, as state is async)
  const [searchInput, setSearchInput] = useState('')

  // Deck Import State
  const [deckName, setDeckName] = useState('')
  const [deckList, setDeckList] = useState('') // Decklist for exporting to server
  const [showDeckImport, setShowDeckImport] = useState(false)

  // Server Decklist State
  const [showServerDecklist, setShowServerDecklist] = useState(false) // Show the server decklist
  const [serverDecklist, setServerDecklist] = useState<IDeckInfo[]>([]) // List of decks from the server
  const [deckCount, setDeckCount] = useState(0) // Number of cards in the selected deck (WIP in server)

  // Misc/Utility
  const [openSnackbar, setOpenSnackbar] = useState('') // Snackbar message


  // Socket.io
  useEffect(() => {
    const socket = io('wss://magic-together-sockets.dootlord.meme', {
      transports: ['websocket'],
      autoConnect: false
    })

    socket.on('connect', () => { console.log('Connected to socket.io server') })
    socket.on('cards', (cards: CardData[]) => { setCards(() => cards) });
    socket.on('disconnect', () => { console.log('Disconnected from socket.io server') })
    socket.on('connect_error', (err: any) => { console.error('Connection error:', err) })
    socket.on('error', (err: any) => { setOpenSnackbar(err) });
    socket.on('decks', (decks: IDeckInfo[]) => { console.log(JSON.stringify(decks)); setServerDecklist(decks) })
    socket.on('deckCountChange', (count: number) => { setDeckCount(count) })

    socket.connect()

    socketRef.current = socket

    const handleKeyPress = (event: KeyboardEvent) => {
      if (showSearchRef.current) return; // If we're typing, ignore event keypresses

      switch (event.key) {
        case 'e':
          generateNewCard()
          break
        case 'r':
          clearCards()
          break
        case 'd':
          setShowDeckImport((prev) => !prev)
          break
        case 's':
          socket.emit('getDecks')
          setShowServerDecklist((prev) => !prev)
          break
        case 'q':
          socket.emit('playTopCardOfDeck')
          break
        default:
          break
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

  /**
   * Trigger scoket to generate a random card
   * @returns 
   */
  function generateRandomCard() {
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('newCard')
  }

  /**
   * Create a card on the board
   * @returns 
   */
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

  /**
   * Requests server to clear all cards
   * @returns 
   */
  function clearCards() {
    if (!socketRef.current) {
      console.error('Socket not connected')
      return
    }
    socketRef.current.emit('clear')
  }

  /**
   * Handle card position change
   * @param index index of the card that has been manipulated
   * @param x x position of card moved
   * @param y y position of card moved
   * @returns 
   */
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

  /**
   * If a card is tapped, emit to server (done via double click)
   * @param index 
   */
  function handleTap(index: number) {
    socketRef.current?.emit('tap', { index })
  }

  /**
   * Manages "enter" keypress on search bar
   * @param event 
   */
  function handleSearchKeyPress(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && searchInput.trim()) {
      console.log('Searching for:', searchInput)
      // Emit search to socket
      socketRef.current?.emit('newCard', { name: searchInput })
      setSearchInput('')
      setShowSearch(false)
    }
  }

  /**
   * Handle deck import button, sends decklist to server and clears the input fields/states
   */
  function handleDeckSubmit() {
    socketRef.current?.emit('newDeck', { deckName, deckList })
    setDeckName('')
    setDeckList('')
    setShowDeckImport(false)
  }

  /**
   * Handle selecting a deck from the server decklist
   * @param deck 
   */
  function deckListSelect(deck: number) {
    socketRef.current?.emit('selectDeck', { index: deck })
    setShowServerDecklist(false)
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
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={handleSearchKeyPress}
          />
        </Search>
      </motion.div>

      <Snackbar
        open={!!openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar('')}
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
            onClick={() => deckListSelect(deck.deckListIndex)}
          >
            <h3 style={{ color: '#fff', margin: 0 }}>{deck.deckName}</h3>
            <p style={{ color: '#888', margin: '8px 0 0 0' }}>
              {new Date(deck.date).toLocaleString()}
            </p>
            <p style={{ color: '#888', margin: '8px 0 0 0' }}>
              {deck.cardCount} cards
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
        Hotkeys: [E] Add Card | [R] Reset | [D] Deck Import | [S] Saved Decks | [Q] Draw Card
      </div>
      <motion.div style={{
        position: 'fixed',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        opacity: 0.3,
        fontSize: '0.8rem'
      }}
        initial={{ opacity: 0 }}
        animate={{ opacity: deckCount > 0 ? 1 : 0 }}>
        Cards in deck: {deckCount}
      </motion.div>
      <div style={{
        position: 'fixed',
        bottom: 10,
        right: 10,
        color: 'white',
        opacity: 0.3,
        fontSize: '0.8rem'
      }}>
        Created by <a href="https://github.com/DootLord" style={{ color: 'white' }}>DootLord</a> 2025
      </div>

    </div >

  )
}

export default App
