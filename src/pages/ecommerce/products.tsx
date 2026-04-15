import type { Product } from 'src/types/api';

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

import { fCurrency } from 'src/utils/format-number';

import { CONFIG } from 'src/config-global';
import { useStoreCode } from 'src/contexts/store-code-context';
import { deleteProduct, getProductsByStore } from 'src/services/products';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { ProductDialog } from './components/product-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const { storeCode } = useStoreCode();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    if (!storeCode) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getProductsByStore({
        store_code: storeCode,
        search: searchQuery || undefined,
        page,
        limit,
      });
      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [storeCode, page, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page on search
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchProducts(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleDialogSuccess = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
    fetchProducts(); // Refresh list
  };

  return (
    <>
      <title>{`Products - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Products</Typography>
            {storeCode && (
              <PermissionButton section="ecommerce" action="create">
                <Button
                  variant="contained"
                  startIcon={<Iconify icon={"mingcute:add-line" as any} />}
                  onClick={handleCreate}
                >
                  Create Product
                </Button>
              </PermissionButton>
            )}
          </Stack>

          {!storeCode && (
            <Alert severity="warning">
              Please select a store code from the Ecommerce section in the sidebar to view products.
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
                  placeholder="Search by product name, code, or barcode..."
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
                        <TableCell>Product</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell>Package</TableCell>
                        <TableCell align="right">MRP</TableCell>
                        <TableCell align="right">Our Price</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell>Status</TableCell>
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
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                            <Typography variant="body2" color="text.secondary">
                              No products found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  src={item.pcode_img}
                                  alt={item.product_name}
                                  variant="rounded"
                                  sx={{ width: 48, height: 48 }}
                                />
                                <Box>
                                  <Typography variant="subtitle2">{item.product_name}</Typography>
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
                                    {item.product_description}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={item.p_code} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{item.brand_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {item.package_size} {item.package_unit}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{fCurrency(item.product_mrp)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="primary">
                                {fCurrency(item.our_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                color={item.store_quantity === 0 ? 'error' : 'success'}
                              >
                                {item.store_quantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={item.pcode_status === 'Y' ? 'Active' : 'Inactive'}
                                color={item.pcode_status === 'Y' ? 'success' : 'default'}
                                size="small"
                              />
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
                                  onClick={() => handleDeleteClick(item.id)}
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

              {!loading && products.length > 0 && (
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

      <ProductDialog
        open={openDialog}
        product={selectedProduct}
        onClose={handleDialogClose}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </>
  );
}
