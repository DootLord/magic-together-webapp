import { motion } from 'framer-motion';
import { IDeckInfo } from '../../App';

interface DeckListModalProps {
  show: boolean;
  serverDecklist: IDeckInfo[];
  onDeckSelect: (index: number) => void;
}

export const DeckListModal = ({ show, serverDecklist, onDeckSelect }: DeckListModalProps) => {
  return (
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
      animate={show ? { opacity: 1 } : { display: "none", opacity: 0 }}
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
          onClick={() => onDeckSelect(deck.deckListIndex)}
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
  );
};
