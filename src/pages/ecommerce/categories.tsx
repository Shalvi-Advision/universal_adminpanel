import type { Category } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
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
import { useStoreCode } from 'src/contexts/store-code-context';
import { deleteCategory, getCategoriesByStore } from 'src/services/categories';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { CategoryDialog } from './components/category-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const { storeCode } = useStoreCode();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState('');
  const limit = 20;

  const fetchCategories = useCallback(async () => {
    if (!storeCode) {
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getCategoriesByStore({
        store_code: storeCode,
        page,
        limit,
      });
      if (response.success) {
        setCategories(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [storeCode, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = () => {
    setSelectedCategory(null);
    setOpenDialog(true);
  };

  const handleEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategory(deleteId);
      setOpenDeleteDialog(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleDialogSuccess = () => {
    setOpenDialog(false);
    fetchCategories();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <>
      <title>{`Categories - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Categories</Typography>
            {storeCode && (
              <PermissionButton section="ecommerce" action="create">
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={handleCreate}
                >
                  Create Category
                </Button>
              </PermissionButton>
            )}
          </Stack>

          {!storeCode && (
            <Alert severity="warning">
              Please select a store code from the Ecommerce section in the sidebar to view
              categories.
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {storeCode && (
            <Card>
              <Scrollbar>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Category ID</TableCell>
                        <TableCell>Department ID</TableCell>
                        <TableCell>Store Code</TableCell>
                        <TableCell align="right">Sequence</TableCell>
                        <TableCell align="right">Columns</TableCell>
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
                      ) : categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                              No categories found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((item) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={item.image_link}
                                  alt={item.category_name}
                                  variant="rounded"
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: item.category_bg_color || 'grey.200',
                                  }}
                                />
                                <Typography variant="subtitle2">{item.category_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.idcategory_master}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.dept_id}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.store_code} size="small" variant="filled" />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{item.sequence_id}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{item.no_of_col}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <PermissionButton section="ecommerce" action="edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(item)}
                                  color="primary"
                                >
                                  <Iconify icon="solar:pen-bold" width={20} />
                                </IconButton>
                              </PermissionButton>
                              <PermissionButton section="ecommerce" action="delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(item._id)}
                                  color="error"
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={20} />
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

              {!loading && categories.length > 0 && (
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

      <CategoryDialog
        open={openDialog}
        category={selectedCategory}
        onClose={() => setOpenDialog(false)}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
      />
    </>
  );
}
