import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { useStoreCode } from 'src/contexts/store-code-context';

export function StoreCodeSelector() {
  const { storeCode, setStoreCode, storeCodes, isLoading, error } = useStoreCode();

  // A single store code is auto-selected by the provider, so there is nothing
  // to pick — render it as a read-only field instead of a dropdown.
  const hasSingleStoreCode = storeCodes.length === 1;

  const handleChange = (event: any) => {
    const selectedCode = event.target.value;
    setStoreCode(selectedCode === '' ? null : selectedCode);
  };

  if (error) {
    return (
      <Box sx={{ px: 2, py: 1 }}>
        <Alert severity="error" sx={{ fontSize: '0.75rem' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="store-code-select-label">Select Store Code</InputLabel>
        <Select
          labelId="store-code-select-label"
          id="store-code-select"
          value={storeCode || ''}
          label="Select Store Code"
          onChange={handleChange}
          disabled={hasSingleStoreCode}
        >
          {!hasSingleStoreCode && (
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
          )}
          {storeCodes.map((store) => (
            <MenuItem key={store.store_code} value={store.store_code}>
              {store.store_code} - {store.store_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
