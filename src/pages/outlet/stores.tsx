import type { Store } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { deleteStore, getAllStores } from 'src/services/stores';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { StoreDialog } from './components/store-dialog';
import { StorePincodesDialog } from './components/store-pincodes-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPincodesDialog, setOpenPincodesDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllStores({
        page,
        limit,
        search: searchQuery || undefined,
      });
      if (response.success) {
        setStores(response.data);
        // Handle both 'pages' and 'totalPages' from backend
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleCreate = () => {
    setSelectedStore(null);
    setOpenDialog(true);
  };

  const handleEdit = (store: Store) => {
    setSelectedStore(store);
    setOpenDialog(true);
  };

  const handleViewPincodes = (store: Store) => {
    setSelectedStore(store);
    setOpenPincodesDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStore(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchStores(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete store');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedStore(null);
  };

  const handleSaveSuccess = () => {
    setOpenDialog(false);
    setSelectedStore(null);
    fetchStores(); // Refresh list
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <>
      <title>{`Stores - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Stores</Typography>
            <PermissionButton section="outlet" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Store
              </Button>
            </PermissionButton>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by store code or store name..."
                value={searchQuery}
                onChange={handleSearchChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Store Name</TableCell>
                      <TableCell>Store Code</TableCell>
                      <TableCell>Pincodes</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : stores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No stores found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      stores.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {item.mobile_outlet_name}
                            </Typography>
                            {item.store_address && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 300,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.store_address}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={item.store_code} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<Iconify icon={'solar:map-point-bold-duotone' as any} />}
                              onClick={() => handleViewPincodes(item)}
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.contact_number}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.is_enabled}
                              color={item.is_enabled === 'Enabled' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <PermissionButton section="outlet" action="edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(item)}
                                color="primary"
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </PermissionButton>
                            <PermissionButton section="outlet" action="delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(item._id)}
                                color="error"
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </PermissionButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            {!loading && stores.length > 0 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Card>
        </Stack>
      </Container>

      <StoreDialog
        open={openDialog}
        store={selectedStore}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
      />

      <StorePincodesDialog
        open={openPincodesDialog}
        store={selectedStore}
        onClose={() => setOpenPincodesDialog(false)}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Store"
        message="Are you sure you want to delete this store? This action cannot be undone."
      />
    </>
  );
}
