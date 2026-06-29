import type { Subcategory } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
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
import { useStoreCode } from 'src/contexts/store-code-context';
import { deleteSubcategory, getSubcategoriesByStore } from 'src/services/subcategories';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { SubcategoryDialog } from './components/subcategory-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const { storeCode } = useStoreCode();
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const fetchSubcategories = useCallback(async () => {
    if (!storeCode) {
      setSubcategories([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getSubcategoriesByStore({
        store_code: storeCode,
        page,
        limit,
        search: searchQuery || undefined,
      });
      if (response.success) {
        setSubcategories(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load subcategories');
    } finally {
      setLoading(false);
    }
  }, [storeCode, page, searchQuery]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCreate = () => {
    setSelectedSubcategory(null);
    setOpenDialog(true);
  };

  const handleEdit = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSubcategory(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchSubcategories(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete subcategory');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedSubcategory(null);
  };

  const handleDialogSuccess = () => {
    setOpenDialog(false);
    setSelectedSubcategory(null);
    fetchSubcategories(); // Refresh list
  };

  return (
    <>
      <title>{`Subcategories - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Subcategories</Typography>
            {storeCode && (
              <PermissionButton section="ecommerce" action="create">
                <Button
                  variant="contained"
                  startIcon={<Iconify icon={"mingcute:add-line" as any} />}
                  onClick={handleCreate}
                >
                  Create Subcategory
                </Button>
              </PermissionButton>
            )}
          </Stack>

          {!storeCode && (
            <Alert severity="warning">
              Please select a store code from the Ecommerce section in the sidebar to view
              subcategories.
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {storeCode && (
            <Card>
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search by subcategory name, ID, or category..."
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
                        <TableCell>Subcategory Name</TableCell>
                        <TableCell>Subcategory ID</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Category ID</TableCell>
                        <TableCell>Department</TableCell>
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
                      ) : subcategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                              No subcategories found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        subcategories.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={item.image_link}
                                  alt={item.sub_category_name}
                                  variant="rounded"
                                  sx={{ width: 48, height: 48, bgcolor: 'grey.200' }}
                                />
                                <Typography variant="subtitle2">
                                  {item.sub_category_name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.idsub_category_master}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.main_category_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.category_id} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.department_name || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <PermissionButton section="ecommerce" action="edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(item)}
                                  color="primary"
                                >
                                  <Iconify icon={"solar:pen-bold" as any} />
                                </IconButton>
                              </PermissionButton>
                              <PermissionButton section="ecommerce" action="delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(item._id)}
                                  color="error"
                                >
                                  <Iconify icon={"solar:trash-bin-trash-bold" as any} />
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

              {!loading && subcategories.length > 0 && (
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
          )}
        </Stack>
      </Container>

      <SubcategoryDialog
        open={openDialog}
        subcategory={selectedSubcategory}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Subcategory"
        message="Are you sure you want to delete this subcategory? This action cannot be undone."
      />
    </>
  );
}
