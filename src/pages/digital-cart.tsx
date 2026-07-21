import type { DigitalCartItem, DigitalCartMeta } from 'src/services/digital-cart';

import { useRef, useState, useEffect, useCallback } from 'react';

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
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { uploadImage } from 'src/services/upload';
import {
  getDigitalCart,
  clearDigitalCart,
  uploadDigitalCartCsv,
  deleteDigitalCartItem,
  toggleDigitalCartItem,
  setDigitalCartItemImage,
} from 'src/services/digital-cart';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { DeleteConfirmDialog } from './dynamic/components/delete-confirm-dialog';

export default function Page() {
  const [items, setItems] = useState<DigitalCartItem[]>([]);
  const [meta, setMeta] = useState<DigitalCartMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string>('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageItemIdRef = useRef<string>('');
  const [imageUploadingId, setImageUploadingId] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getDigitalCart();
      if (response.success) {
        setItems(response.data);
        setMeta(response.meta);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load digital cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const response = await uploadDigitalCartCsv(file);
      setSuccess(response.message);
      await fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = (id: string) => {
    imageItemIdRef.current = id;
    imageInputRef.current?.click();
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const id = imageItemIdRef.current;
    if (!file || !id) return;

    try {
      setImageUploadingId(id);
      setError('');
      const uploaded = await uploadImage(file, 'digital-cart');
      await setDigitalCartItemImage(id, uploaded.url);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, image_url: uploaded.url } : item))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to upload product image');
    } finally {
      setImageUploadingId('');
    }
  };

  const handleImageClear = async (id: string) => {
    try {
      await setDigitalCartItemImage(id, '');
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, image_url: '' } : item)));
    } catch (err: any) {
      setError(err.message || 'Failed to remove product image');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleDigitalCartItem(id);
      setItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, is_active: !item.is_active } : item))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to toggle item');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDigitalCartItem(deleteId);
      setOpenDeleteDialog(false);
      setItems((prev) => prev.filter((item) => item._id !== deleteId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      setOpenDeleteDialog(false);
    }
  };

  const handleClearConfirm = async () => {
    try {
      await clearDigitalCart();
      setOpenClearDialog(false);
      setSuccess('Digital cart cleared');
      await fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to clear digital cart');
      setOpenClearDialog(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filteredItems = query
    ? items.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          item.p_code.toLowerCase().includes(query) ||
          item.offer_text.toLowerCase().includes(query)
      )
    : items;

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h4">Digital Cart</Typography>

        <Stack direction="row" spacing={1.5}>
          <PermissionButton section="digitalCart" action="delete">
            <Button
              color="error"
              variant="outlined"
              disabled={items.length === 0}
              onClick={() => setOpenClearDialog(true)}
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            >
              Clear All
            </Button>
          </PermissionButton>

          <PermissionButton section="digitalCart" action="create">
            <Button
              variant="contained"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              startIcon={
                uploading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <Iconify icon={'solar:upload-bold' as any} />
                )
              }
            >
              {uploading ? 'Uploading…' : 'Upload CSV'}
            </Button>
          </PermissionButton>
        </Stack>
      </Stack>

      <input
        hidden
        type="file"
        accept=".csv,text/csv"
        ref={fileInputRef}
        onChange={handleFileSelected}
      />
      <input
        hidden
        type="file"
        accept="image/*"
        ref={imageInputRef}
        onChange={handleImageSelected}
      />

      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload the offer sheet CSV (columns: P-Code, Product Name, MRP, Offer Price, Offer — plus an
        optional Image column with photo URLs). Photos can also be uploaded per product below, and
        products without one borrow the store catalog photo when the P-Code matches. Each
        upload replaces the current list for the selected project, and the public digital cart
        website updates instantly.
        {meta?.source_file && (
          <>
            {' '}
            Current sheet: <b>{meta.source_file}</b>
            {meta.last_uploaded_at &&
              ` (uploaded ${new Date(meta.last_uploaded_at).toLocaleString()})`}
            {` — ${meta.total} products, ${meta.active} visible.`}
          </>
        )}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Box p={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by product name, P-Code or offer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>P-Code</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>MRP</TableCell>
                    <TableCell>Offer Price</TableCell>
                    <TableCell>Offer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          {items.length === 0
                            ? 'No products yet — upload the offer sheet CSV to publish the digital cart.'
                            : 'No products match your search.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell>{item.position + 1}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Avatar
                              variant="rounded"
                              src={item.image_url || undefined}
                              sx={{ width: 36, height: 36, bgcolor: 'background.neutral' }}
                            >
                              <Iconify
                                icon={'solar:gallery-bold-duotone' as any}
                                width={18}
                                sx={{ color: 'text.disabled' }}
                              />
                            </Avatar>
                            <PermissionButton section="digitalCart" action="edit">
                              <IconButton
                                size="small"
                                disabled={imageUploadingId === item._id}
                                onClick={() => pickImage(item._id)}
                                title="Upload product image"
                              >
                                {imageUploadingId === item._id ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <Iconify icon={'solar:camera-add-bold' as any} width={16} />
                                )}
                              </IconButton>
                            </PermissionButton>
                            {item.image_url && (
                              <PermissionButton section="digitalCart" action="edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleImageClear(item._id)}
                                  title="Remove image"
                                >
                                  <Iconify icon="mingcute:close-line" width={14} />
                                </IconButton>
                              </PermissionButton>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{item.p_code || '—'}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.mrp || '—'}</TableCell>
                        <TableCell>{item.offer_price || '—'}</TableCell>
                        <TableCell>
                          {item.offer_text ? (
                            <Chip size="small" color="warning" variant="outlined" label={item.offer_text} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={item.is_active ? 'success' : 'default'}
                            label={item.is_active ? 'Visible' : 'Hidden'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <PermissionButton section="digitalCart" action="edit">
                            <IconButton
                              size="small"
                              onClick={() => handleToggle(item._id)}
                              title={item.is_active ? 'Hide from website' : 'Show on website'}
                            >
                              <Iconify
                                icon={item.is_active ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                              />
                            </IconButton>
                          </PermissionButton>
                          <PermissionButton section="digitalCart" action="delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteId(item._id);
                                setOpenDeleteDialog(true);
                              }}
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
        )}
      </Card>

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete product"
        message="Remove this product from the digital cart? It will disappear from the public website."
      />

      <DeleteConfirmDialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
        onConfirm={handleClearConfirm}
        title="Clear digital cart"
        message="Remove ALL products from the digital cart for this project? The public website will show an empty list until a new CSV is uploaded."
      />
    </Container>
  );
}
