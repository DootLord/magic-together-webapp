import { motion } from 'framer-motion';

interface HotkeysDisplayProps {
  deckCount: number;
}

export const HotkeysDisplay = ({ deckCount }: HotkeysDisplayProps) => {
  return (
    <>
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
    </>
  );
};
