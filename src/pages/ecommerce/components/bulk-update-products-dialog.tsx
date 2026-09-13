import type { BulkProductCsvUpdateResult } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { bulkUpdateProductsCsv } from 'src/services/products';

import { Iconify } from 'src/components/iconify';

// A store admin's own periodic rate/stock re-export — see the backend
// route's own comment for the exact column set. Update-only: a p_code the
// current catalog doesn't already have is reported and skipped, never
// inserted (this file carries no department/category to place a new
// product under). Never touches images or category placement.
interface BulkUpdateProductsDialogProps {
  open: boolean;
  storeCode?: string | null;
  projectCode: string;
  projectName?: string;
  onClose: () => void;
  onDone: () => void;
}

export function BulkUpdateProductsDialog({
  open,
  storeCode,
  projectCode,
  projectName,
  onClose,
  onDone,
}: BulkUpdateProductsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkProductCsvUpdateResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFile(null);
      setResult(null);
      setError('');
    }
  }, [open]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      setResult(null);
      const res = await bulkUpdateProductsCsv(file, storeCode ?? undefined);
      setResult(res.data);
      setFile(null);
      onDone();
    } catch (err: any) {
      setError(err.message || 'Bulk update failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Products from CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Upload your rate/stock sheet — columns P_CODE, BARCODE, package_size, BRAND_NAME,
            BR_CODE, our_price, product_mrp, quantity, store_code_status — to refresh price,
            stock, and active/inactive status for every p_code it mentions. A p_code not already
            in the catalog is skipped, not created; nothing else (images, department, category) is
            touched.
          </Typography>

          <Alert severity={storeCode ? 'info' : 'warning'}>
            This will update products for{' '}
            <strong>
              {projectName ? `${projectName} (${projectCode})` : projectCode}
            </strong>
            {storeCode ? (
              <>
                {' '}
                — store <strong>{storeCode}</strong>.
              </>
            ) : (
              ' — no store selected, so it will match by P_CODE across every store in this project.'
            )}
          </Alert>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button component="label" variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />}>
              {file ? file.name : 'Choose CSV file'}
              <input type="file" accept=".csv" hidden onChange={handleFileSelected} />
            </Button>
          </Stack>

          {result && (
            <Alert severity={result.skipped_not_found > 0 ? 'warning' : 'success'}>
              Updated {result.updated} of {result.total_rows} product(s) from the CSV — matched
              against <strong>{result.project_code}</strong>
              {result.store_code ? (
                <>
                  {' '}
                  / store <strong>{result.store_code}</strong>
                </>
              ) : (
                ' (no store filter)'
              )}
              .
              <Box component="ul" sx={{ m: '8px 0 0', pl: 2.5 }}>
                <li>
                  <Typography variant="caption">{result.price_changed} price change(s)</Typography>
                </li>
                <li>
                  <Typography variant="caption">
                    {result.status_changed} active/inactive change(s)
                  </Typography>
                </li>
                {result.skipped_not_found > 0 && (
                  <li>
                    <Typography variant="caption" color="error">
                      {result.skipped_not_found} p_code(s) not found in the catalog, skipped:{' '}
                      {result.skipped_not_found_codes.slice(0, 10).join(', ')}
                      {result.skipped_not_found > 10 ? ', …' : ''}
                    </Typography>
                  </li>
                )}
                {result.package_size_not_updated > 0 && (
                  <li>
                    <Typography variant="caption" color="warning.main">
                      {result.package_size_not_updated} product(s) had an unrecognized package
                      size — left unchanged, everything else on those rows was still updated
                    </Typography>
                  </li>
                )}
              </Box>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {result ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? 'Updating…' : 'Upload & Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
