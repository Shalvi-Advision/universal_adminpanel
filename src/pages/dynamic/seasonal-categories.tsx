import type { SeasonalCategory } from 'src/types/api';

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
import { deleteSeasonalCategory, getAllSeasonalCategories } from 'src/services/seasonal-categories';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { DeleteConfirmDialog } from './components/delete-confirm-dialog';
import { SeasonalCategoryDialog } from './components/seasonal-category-dialog';

export default function Page() {
  const [seasonalCategories, setSeasonalCategories] = useState<SeasonalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSeasonalCategory, setSelectedSeasonalCategory] =
    useState<SeasonalCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');

  const fetchSeasonalCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllSeasonalCategories({ page: 1, limit: 100 });
      if (response.success) {
        setSeasonalCategories(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load seasonal categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonalCategories();
  }, [fetchSeasonalCategories]);

  const handleCreate = () => {
    setSelectedSeasonalCategory(null);
    setOpenDialog(true);
  };

  const handleEdit = (seasonalCategory: SeasonalCategory) => {
    setSelectedSeasonalCategory(seasonalCategory);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSeasonalCategory(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchSeasonalCategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete seasonal category');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedSeasonalCategory(null);
  };

  const handleSaveSuccess = () => {
    setOpenDialog(false);
    setSelectedSeasonalCategory(null);
    fetchSeasonalCategories(); // Refresh list
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
      <title>{`Seasonal Categories - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Seasonal Categories</Typography>
            <PermissionButton section="dynamicSection" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Seasonal Category
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
                      <TableCell>Season</TableCell>
                      <TableCell>Store Code(s)</TableCell>
                      <TableCell>Subcategories</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Sequence</TableCell>
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
                    ) : seasonalCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No seasonal categories found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      seasonalCategories.map((item) => (
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
                            <Chip
                              label={item.season || 'all'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
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
                              label={`${item.subcategories?.length || 0} subcategory(ies)`}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={item.is_active ? 'Active' : 'Inactive'}
                              color={item.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.start_date ? formatDate(item.start_date) : '-'}
                          </TableCell>
                          <TableCell>{item.end_date ? formatDate(item.end_date) : '-'}</TableCell>
                          <TableCell>{item.sequence}</TableCell>
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

      <SeasonalCategoryDialog
        open={openDialog}
        seasonalCategory={selectedSeasonalCategory}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Seasonal Category"
        message="Are you sure you want to delete this seasonal category? This action cannot be undone."
      />
    </>
  );
}
