import type { DeliverySlot } from 'src/types/api';

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
import { deleteDeliverySlot, getAllDeliverySlots } from 'src/services/delivery-slots';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { DeliverySlotDialog } from './components/delivery-slot-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchDeliverySlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllDeliverySlots({
        page,
        limit,
      });
      if (response.success) {
        setDeliverySlots(response.data);
        // Handle both 'pages' and 'totalPages' from backend
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery slots');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDeliverySlots();
  }, [fetchDeliverySlots]);

  const handleCreate = () => {
    setSelectedSlot(null);
    setOpenDialog(true);
  };

  const handleEdit = (slot: DeliverySlot) => {
    setSelectedSlot(slot);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDeliverySlot(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchDeliverySlots(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete delivery slot');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedSlot(null);
  };

  const handleSaveSuccess = () => {
    setOpenDialog(false);
    setSelectedSlot(null);
    fetchDeliverySlots(); // Refresh list
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Format time slot for display
  const formatTimeSlot = (from: string, to: string) => {
    // Input format: "09:00:00" or "09:00"
    // Output format: "09:00 AM - 10:00 PM"
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return `${formatTime(from)} - ${formatTime(to)}`;
  };

  return (
    <>
      <title>{`Delivery Slots - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Delivery Slots</Typography>
            <PermissionButton section="outlet" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Delivery Slot
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
                      <TableCell>Slot ID</TableCell>
                      <TableCell>Store Code</TableCell>
                      <TableCell>Time Slot</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : deliverySlots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No delivery slots found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliverySlots.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{item.iddelivery_slot}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.store_code} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTimeSlot(item.delivery_slot_from, item.delivery_slot_to)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.is_active === 'yes' ? 'Active' : 'Inactive'}
                              color={item.is_active === 'yes' ? 'success' : 'default'}
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

            {!loading && deliverySlots.length > 0 && (
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

      <DeliverySlotDialog
        open={openDialog}
        deliverySlot={selectedSlot}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Slot"
        message="Are you sure you want to delete this delivery slot? This action cannot be undone."
      />
    </>
  );
}
