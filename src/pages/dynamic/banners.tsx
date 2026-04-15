import type { Banner } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { deleteBanner, getAllBanners } from 'src/services/banners';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { BannerDialog } from './components/banner-dialog';
import { DeleteConfirmDialog } from './components/delete-confirm-dialog';

export default function Page() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = { page: 1, limit: 100 };
      if (sectionFilter) {
        params.section_name = sectionFilter;
      }
      const response = await getAllBanners(params);
      if (response.success) {
        setBanners(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [sectionFilter]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleCreate = () => {
    setSelectedBanner(null);
    setOpenDialog(true);
  };

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBanner(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId('');
      fetchBanners(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner');
      setOpenDeleteDialog(false);
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedBanner(null);
  };

  const handleSaveSuccess = () => {
    setOpenDialog(false);
    setSelectedBanner(null);
    fetchBanners(); // Refresh list
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBannerCount = (banner: Banner): number => {
    if (banner.banner_assets && banner.banner_assets.length > 0) {
      return banner.banner_assets.length;
    }
    if (banner.banner_urls) {
      return Object.keys(banner.banner_urls).length;
    }
    return 1; // Default to 1 if only image_url exists
  };

  return (
    <>
      <title>{`Banners - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4">Banners</Typography>
            <PermissionButton section="dynamicSection" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Banner
              </Button>
            </PermissionButton>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Filter by Section"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All Sections</MenuItem>
              <MenuItem value="home_top">Home Top</MenuItem>
              <MenuItem value="home_middle">Home Middle</MenuItem>
              <MenuItem value="category_banner">Category Banner</MenuItem>
              <MenuItem value="product_detail_banner">Product Detail Banner</MenuItem>
            </TextField>
          </Stack>

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Section Name</TableCell>
                      <TableCell>Banner Count</TableCell>
                      <TableCell>Store Code(s)</TableCell>
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
                    ) : banners.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No banners found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      banners.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Typography variant="subtitle2">{item.title}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.section_name} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${getBannerCount(item)} banner(s)`}
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

      <BannerDialog
        open={openDialog}
        banner={selectedBanner}
        onClose={handleDialogClose}
        onSuccess={handleSaveSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
      />
    </>
  );
}
