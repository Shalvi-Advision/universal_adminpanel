import type { Banner, BannerAsset, BannerPayload } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { createBanner, updateBanner } from 'src/services/banners';

import { Iconify } from 'src/components/iconify';
import { ImageUpload } from 'src/components/image-upload';

import StoreCodeSelector from './store-code-selector';

// Where a banner can appear. This was a free-text field, so a placement the
// app does not read — a typo, or a name invented on the spot — saved happily
// and then showed nothing, with no error anywhere to explain why.
const PLACEMENTS = [
  { value: 'home_top', label: 'Home — hero carousel', hint: 'The large carousel at the top of home' },
  { value: 'home_middle', label: 'Home — mid-page strip', hint: 'Between the first product blocks on home' },
  { value: 'category_banner', label: 'Category screen', hint: 'Shown on the category listing' },
  {
    value: 'product_detail_banner',
    label: 'Product detail screen',
    hint: 'Shown on the product detail page',
  },
];

interface BannerDialogProps {
  open: boolean;
  banner: Banner | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BannerDialog({ open, banner, onClose, onSuccess }: BannerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [actionType, setActionType] = useState<'category' | 'product' | 'url' | 'none'>('none');
  const [actionValue, setActionValue] = useState('');
  const [storeCodes, setStoreCodes] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [sequence, setSequence] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bannerAssets, setBannerAssets] = useState<BannerAsset[]>([]);

  // Load data when editing
  useEffect(() => {
    if (banner) {
      setTitle(banner.title || '');
      setSectionName(banner.section_name || '');
      setActionType(banner.action?.type || 'none');
      setActionValue(banner.action?.value || '');
      // Combine both store_code and store_codes for backward compatibility
      const codes = banner.store_codes || [];
      if (banner.store_code && !codes.includes(banner.store_code)) {
        codes.push(banner.store_code);
      }
      setStoreCodes(codes);
      setIsActive(banner.is_active);
      setSequence(banner.sequence || 0);
      setStartDate(banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : '');
      setEndDate(banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : '');
      
      // Load banner assets from banner_assets or banner_urls
      if (banner.banner_assets && banner.banner_assets.length > 0) {
        setBannerAssets(banner.banner_assets);
      } else if (banner.banner_urls) {
        // Convert banner_urls object to banner_assets array
        const assets: BannerAsset[] = Object.entries(banner.banner_urls).map(([key, urls]) => ({
          key,
          desktop: urls.desktop,
          mobile: urls.mobile,
        }));
        setBannerAssets(assets);
      } else {
        setBannerAssets([]);
      }
    } else {
      // Reset form for create
      setTitle('');
      setSectionName('');
      setActionType('none');
      setActionValue('');
      setStoreCodes([]);
      setIsActive(true);
      setSequence(0);
      setStartDate('');
      setEndDate('');
      setBannerAssets([]);
    }
    setError('');
  }, [banner, open]);

  const handleAddBannerAsset = () => {
    if (bannerAssets.length >= 10) {
      setError('Maximum 10 banner assets allowed');
      return;
    }
    const newKey = `bannerUrl${bannerAssets.length + 1}`;
    setBannerAssets([
      ...bannerAssets,
      { key: newKey, desktop: '', mobile: '' },
    ]);
  };

  const handleRemoveBannerAsset = (index: number) => {
    setBannerAssets(bannerAssets.filter((_, i) => i !== index));
  };

  const handleBannerAssetChange = (
    index: number,
    field: 'key' | 'desktop' | 'mobile',
    value: string
  ) => {
    const newAssets = [...bannerAssets];
    newAssets[index] = { ...newAssets[index], [field]: value };
    setBannerAssets(newAssets);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!sectionName.trim()) {
      setError('Section name is required');
      return false;
    }
    if (bannerAssets.length === 0) {
      setError('At least one banner asset is required');
      return false;
    }
    // Validate each banner asset has at least desktop or mobile URL
    for (let i = 0; i < bannerAssets.length; i++) {
      const asset = bannerAssets[i];
      if (!asset.desktop?.trim() && !asset.mobile?.trim()) {
        setError(`Banner asset ${i + 1} must have at least a desktop or mobile URL`);
        return false;
      }
    }
    if (actionType !== 'none' && !actionValue.trim()) {
      setError(`Action value is required when action type is ${actionType}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Prepare banner assets with auto-generated keys if missing
    const preparedAssets: BannerAsset[] = bannerAssets.map((asset, index) => ({
      key: asset.key?.trim() || `bannerUrl${index + 1}`,
      desktop: asset.desktop?.trim() || undefined,
      mobile: asset.mobile?.trim() || undefined,
    }));

    const payload: BannerPayload = {
      title: title.trim(),
      section_name: sectionName.trim(),
      banner_assets: preparedAssets,
      action: {
        type: actionType,
        value: actionType !== 'none' ? actionValue.trim() : undefined,
      },
      store_codes: storeCodes.length > 0 ? storeCodes : undefined,
      is_active: isActive,
      sequence,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
    };

    try {
      if (banner) {
        await updateBanner(banner._id, payload);
      } else {
        await createBanner(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save banner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{banner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            select
            fullWidth
            label="Placement"
            value={PLACEMENTS.some((p) => p.value === sectionName) ? sectionName : ''}
            onChange={(e) => setSectionName(e.target.value)}
            required
            helperText={
              sectionName && !PLACEMENTS.some((p) => p.value === sectionName)
                ? `Saved as "${sectionName}", which no screen reads — pick a placement to make it visible`
                : PLACEMENTS.find((p) => p.value === sectionName)?.hint ||
                  'Where in the app this banner appears'
            }
            error={Boolean(sectionName) && !PLACEMENTS.some((p) => p.value === sectionName)}
          >
            {PLACEMENTS.map((placement) => (
              <MenuItem key={placement.value} value={placement.value}>
                {placement.label}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Banner Assets (up to 10)
            </Typography>
            <Stack spacing={2}>
              {bannerAssets.map((asset, index) => (
                <Card key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        Banner {index + 1}
                      </Typography>
                      <TextField
                        size="small"
                        label="Key (optional)"
                        value={asset.key || `bannerUrl${index + 1}`}
                        onChange={(e) => handleBannerAssetChange(index, 'key', e.target.value)}
                        sx={{ flex: 1 }}
                        helperText="Auto-generated if not provided"
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveBannerAsset(index)}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <ImageUpload
                          label="Desktop URL"
                          value={asset.desktop || ''}
                          onChange={(url) => handleBannerAssetChange(index, 'desktop', url)}
                          folder="banners"
                          helperText="At least one URL required"
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <ImageUpload
                          label="Mobile URL"
                          value={asset.mobile || ''}
                          onChange={(url) => handleBannerAssetChange(index, 'mobile', url)}
                          folder="banners"
                          helperText="At least one URL required"
                        />
                      </Box>
                    </Stack>

                    {(asset.desktop || asset.mobile) && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1,
                          p: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                        }}
                      >
                        {asset.desktop && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Desktop Preview:
                            </Typography>
                            <Box
                              component="img"
                              src={asset.desktop}
                              alt={`Desktop ${index + 1}`}
                              sx={{
                                width: '100%',
                                maxHeight: 100,
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </Box>
                        )}
                        {asset.mobile && (
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Mobile Preview:
                            </Typography>
                            <Box
                              component="img"
                              src={asset.mobile}
                              alt={`Mobile ${index + 1}`}
                              sx={{
                                width: '100%',
                                maxHeight: 100,
                                objectFit: 'contain',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleAddBannerAsset}
              disabled={bannerAssets.length >= 10}
              sx={{ mt: 2 }}
            >
              Add Banner Asset {bannerAssets.length >= 10 ? '(Max 10)' : ''}
            </Button>
          </Box>

          <Divider />

          <TextField
            fullWidth
            select
            label="Action Type"
            value={actionType}
            onChange={(e) => {
              setActionType(e.target.value as 'category' | 'product' | 'url' | 'none');
              if (e.target.value === 'none') {
                setActionValue('');
              }
            }}
            required
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="category">Category</MenuItem>
            <MenuItem value="product">Product</MenuItem>
            <MenuItem value="url">URL</MenuItem>
          </TextField>

          {actionType !== 'none' && (
            <TextField
              fullWidth
              label={`Action Value (${actionType})`}
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              required
              helperText={
                actionType === 'category'
                  ? 'Category ID'
                  : actionType === 'product'
                    ? 'Product SKU'
                    : 'Full URL'
              }
            />
          )}

          <StoreCodeSelector
            value={storeCodes}
            onChange={setStoreCodes}
            label="Select Store Codes"
            helperText="Select one or more store codes for this banner"
          />

          <TextField
            fullWidth
            label="Sequence"
            value={sequence}
            onChange={(e) => setSequence(Number(e.target.value))}
            type="number"
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Is Active"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : banner ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
