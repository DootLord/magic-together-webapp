import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import './App.css'
import { DefaultEventsMap } from 'socket.io'
import Card from './components/card/Card'
import { Snackbar } from '@mui/material'
import { SearchBar } from './components/SearchBar/SearchBar'
import { DeckImportModal } from './components/DeckImportModal/DeckImportModal'
import { DeckListModal } from './components/DeckListModal/DeckListModal'
import { HotkeysDisplay } from './components/HotkeysDisplay/HotkeysDisplay'
import { CardData, IDeckInfo } from './types/types'

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

      <SearchBar
        showSearch={showSearch}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onKeyDown={handleSearchKeyPress}
      />

      <Snackbar
        open={!!openSnackbar}
        autoHideDuration={5000}
        onClose={() => setOpenSnackbar('')}
        message={openSnackbar}
      />

      <DeckListModal
        show={showServerDecklist}
        serverDecklist={serverDecklist}
        onDeckSelect={deckListSelect}
      />

      <DeckImportModal
        show={showDeckImport}
        deckName={deckName}
        deckList={deckList}
        onDeckNameChange={setDeckName}
        onDeckListChange={setDeckList}
        onSubmit={handleDeckSubmit}
      />

      <HotkeysDisplay deckCount={deckCount} />
    </div>
  )
}

export default App
