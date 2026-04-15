import type { Offer } from 'src/types/api';

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
import Pagination from '@mui/material/Pagination';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { deleteOffer, toggleOffer, getAllOffers } from 'src/services/offers';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { OfferDialog } from './offers/components/offer-dialog';
import { DeleteConfirmDialog } from './dynamic/components/delete-confirm-dialog';

export default function Page() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllOffers({ page, limit });
      if (response.success) {
        setOffers(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleCreate = () => {
    setSelectedOffer(null);
    setOpenDialog(true);
  };

  const handleEdit = (offer: Offer) => {
    setSelectedOffer(offer);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteOffer(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchOffers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete offer');
      setOpenDeleteDialog(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleOffer(id);
      fetchOffers();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle offer status');
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedOffer(null);
  };

  const handleDialogSuccess = () => {
    setOpenDialog(false);
    setSelectedOffer(null);
    fetchOffers();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const formatDiscount = (item: Offer) => {
    if (item.discount_type === 'flat') {
      return `₹${item.discount_amount}`;
    }
    return `${item.discount_amount}%`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'No Expiry';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  return (
    <>
      <title>{`Offers - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Offers</Typography>
            <PermissionButton section="offers" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon={'solar:tag-price-bold-duotone' as any} />}
                onClick={handleCreate}
              >
                Create Offer
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
                      <TableCell>Type</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Min Cart Value</TableCell>
                      <TableCell>Store Code</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Valid Until</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : offers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No offers found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      offers.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{item.title}</Typography>
                            {item.description && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  maxWidth: 250,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(item.offer_type || 'cart_discount') === 'product_deal' ? 'Product Deal' : 'Cart Discount'}
                              color={(item.offer_type || 'cart_discount') === 'product_deal' ? 'warning' : 'primary'}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {(item.offer_type || 'cart_discount') === 'product_deal' ? (
                              <Typography variant="body2" color="text.secondary">
                                {item.deal_products?.length || 0} product(s)
                              </Typography>
                            ) : (
                              <Typography variant="body2">{formatDiscount(item)}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              ₹{item.min_cart_value.toLocaleString('en-IN')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.store_codes?.length ? (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                {item.store_codes.map((sc: string) => (
                                  <Chip key={sc} label={sc} size="small" variant="outlined" />
                                ))}
                              </Stack>
                            ) : (
                              <Chip label="All Stores" size="small" color="info" />
                            )}
                          </TableCell>
                          <TableCell>
                            <PermissionButton section="offers" action="edit" fallback="disable">
                              <Chip
                                label={item.is_active ? 'Active' : 'Inactive'}
                                color={item.is_active ? 'success' : 'default'}
                                size="small"
                                onClick={() => handleToggle(item._id)}
                                sx={{ cursor: 'pointer' }}
                              />
                            </PermissionButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(item.valid_until)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.priority}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <PermissionButton section="offers" action="edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(item)}
                                color="primary"
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </PermissionButton>
                            <PermissionButton section="offers" action="delete">
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

            {!loading && offers.length > 0 && (
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

      <OfferDialog
        open={openDialog}
        offer={selectedOffer}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
      />
    </>
  );
}
