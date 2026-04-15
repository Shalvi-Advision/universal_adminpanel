import type { BestSeller } from 'src/types/api';

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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { deleteBestSeller, getAllBestSellers } from 'src/services/best-sellers';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { BestSellerDialog } from './components/best-seller-dialog';
import { DeleteConfirmDialog } from './components/delete-confirm-dialog';

export default function Page() {
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBestSeller, setSelectedBestSeller] = useState<BestSeller | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllBestSellers({ page: 1, limit: 100 });
      if (response.success) {
        setBestSellers(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load best sellers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  const handleCreate = () => {
    setSelectedBestSeller(null);
    setOpenDialog(true);
  };

  const handleEdit = (bestSeller: BestSeller) => {
    setSelectedBestSeller(bestSeller);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBestSeller(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchBestSellers(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete best seller');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedBestSeller(null);
  };

  const handleSaveSuccess = () => {
    setOpenDialog(false);
    setSelectedBestSeller(null);
    fetchBestSellers(); // Refresh list
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <title>{`Best Sellers - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Best Sellers</Typography>
            <PermissionButton section="dynamicSection" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Best Seller
              </Button>
            </PermissionButton>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Store Code(s)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sequence</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : bestSellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No best sellers found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      bestSellers.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{item.title}</Typography>
                            {item.description && (
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {item.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.store_codes && item.store_codes.length > 0 ? (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {item.store_codes.map((code, index) => (
                                  <Chip key={index} label={code} size="small" variant="outlined" />
                                ))}
                              </Box>
                            ) : item.store_code ? (
                              <Chip label={item.store_code} size="small" variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.is_active ? 'Active' : 'Inactive'}
                              color={item.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{item.sequence}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
                          <TableCell align="right">
                            <PermissionButton section="dynamicSection" action="edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(item)}
                                color="primary"
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </PermissionButton>
                            <PermissionButton section="dynamicSection" action="delete">
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
          </Card>
        </Stack>
      </Container>

      <BestSellerDialog
        open={openDialog}
        bestSeller={selectedBestSeller}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Best Seller"
        message="Are you sure you want to delete this best seller? This action cannot be undone."
      />
    </>
  );
}

