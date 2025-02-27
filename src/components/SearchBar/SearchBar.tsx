import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import { Search, SearchIconWrapper, StyledInputBase } from '../../defaultMuiStyles';

interface SearchBarProps {
  showSearch: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchBar = ({ showSearch, searchInput, onSearchChange, onKeyDown }: SearchBarProps) => {
  return (
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
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </Search>
    </motion.div>
  );
};
