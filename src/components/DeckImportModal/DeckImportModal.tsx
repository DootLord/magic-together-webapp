import { Button, TextField } from '@mui/material';
import { motion } from 'framer-motion';

interface DeckImportModalProps {
  show: boolean;
  deckName: string;
  deckList: string;
  onDeckNameChange: (value: string) => void;
  onDeckListChange: (value: string) => void;
  onSubmit: () => void;
}

export const DeckImportModal = ({ 
  show, 
  deckName, 
  deckList, 
  onDeckNameChange, 
  onDeckListChange, 
  onSubmit 
}: DeckImportModalProps) => {
  return (
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
      animate={{ scale: show ? 1 : 0 }}
    >
      <TextField
        fullWidth
        margin="normal"
        label="Deck Name"
        value={deckName}
        onChange={(e) => onDeckNameChange(e.target.value)}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Paste deck list here..."
        multiline
        rows={10}
        value={deckList}
        onChange={(e) => onDeckListChange(e.target.value)}
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={onSubmit}
        sx={{ mt: 2 }}
      >
        Import Deck
      </Button>
    </motion.div>
  );
};
