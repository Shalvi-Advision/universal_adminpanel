import type { BulkProductCsvUpdateResult } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { bulkUpdateProductsCsv } from 'src/services/products';

import { Iconify } from 'src/components/iconify';

// A store admin's own periodic rate/stock re-export — see the backend
// route's own comment for the exact column set and full sync_mode
// semantics. Plain mode is update-only: a p_code the current catalog
// doesn't already have is reported and skipped, never inserted. Sync mode
// additionally creates newly-stocked (p_code, store) combos (cloning
// classification from a sibling elsewhere) and deactivates ones missing
// from today's file, per store — guarded against a partial file wiping out
// a store's catalog in one go.
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
  // Defaults ON: every tenant's daily export seen so far only ever marks
  // rows 'Y' (a product is simply absent once it's no longer stocked,
  // never listed with an explicit 'N') — with this off, nothing is ever
  // deactivated, so a product that drops out of the file silently stays
  // active forever instead of going inactive until it reappears. That
  // exact gap caused a real incident: a plain-mode upload reactivated
  // ~1,300 products across 3 stores with no way to undo it short of a
  // sync-mode run against a correct file.
  const [syncMode, setSyncMode] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [result, setResult] = useState<BulkProductCsvUpdateResult | null>(null);
  const [preview, setPreview] = useState<BulkProductCsvUpdateResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFile(null);
      setSyncMode(true);
      setResult(null);
      setPreview(null);
      setError('');
    }
  }, [open]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setPreview(null);
    setError('');
  };

  const handlePreview = async () => {
    if (!file) return;
    try {
      setPreviewing(true);
      setError('');
      const res = await bulkUpdateProductsCsv(file, { storeCode: storeCode ?? undefined, syncMode, dryRun: true });
      setPreview(res.data);
    } catch (err: any) {
      setError(err.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleUpload = async (confirmDeactivation = false) => {
    if (!file) return;
    try {
      setUploading(true);
      setError('');
      setResult(null);
      const res = await bulkUpdateProductsCsv(file, {
        storeCode: storeCode ?? undefined,
        syncMode,
        confirmDeactivation,
      });
      setResult(res.data);
      setPreview(null);
      // A blocked deactivation still needs the same file to force it
      // through, so only clear the picker once nothing is left pending.
      if (!res.data.deactivation_blocked?.length) {
        setFile(null);
      }
      onDone();
    } catch (err: any) {
      setError(err.message || 'Bulk update failed');
    } finally {
      setUploading(false);
    }
  };

  const renderCounts = (r: BulkProductCsvUpdateResult) => (
    <Box component="ul" sx={{ m: '8px 0 0', pl: 2.5 }}>
      <li>
        <Typography variant="caption">{r.price_changed} price change(s)</Typography>
      </li>
      <li>
        <Typography variant="caption">{r.status_changed} active/inactive change(s)</Typography>
      </li>
      {r.sync_mode && (
        <>
          <li>
            <Typography variant="caption" color="success.main">
              {r.created ?? 0} product(s) newly created (a store carrying a p_code for the first
              time)
            </Typography>
          </li>
          {!!r.created_unclassified && (
            <li>
              <Typography variant="caption" color="warning.main">
                {r.created_unclassified} of those have no department/category/subcategory anywhere
                in the catalog to copy, so they were created unclassified — find them via the
                Products page&apos;s &quot;Unclassified only&quot; filter to assign one:{' '}
                {r.created_unclassified_details?.slice(0, 10).join(', ')}
                {r.created_unclassified_details && r.created_unclassified_details.length > 10 ? ', …' : ''}
              </Typography>
            </li>
          )}
          <li>
            <Typography variant="caption" color="warning.main">
              {r.deactivated ?? 0} product(s) deactivated (not in today&apos;s file for their store)
            </Typography>
          </li>
          {!!r.unresolvable_pcodes?.length && (
            <li>
              <Typography variant="caption" color="error">
                {r.unresolvable_pcodes.length} p_code(s) couldn&apos;t be created at all (no package
                size, product name, or price available): {r.unresolvable_pcodes.slice(0, 10).join(', ')}
                {r.unresolvable_pcodes.length > 10 ? ', …' : ''}
              </Typography>
            </li>
          )}
        </>
      )}
      {r.skipped_not_found > 0 && (
        <li>
          <Typography variant="caption" color="error">
            {r.skipped_not_found} p_code(s) not found in the catalog, skipped:{' '}
            {r.skipped_not_found_codes.slice(0, 10).join(', ')}
            {r.skipped_not_found > 10 ? ', …' : ''}
          </Typography>
        </li>
      )}
      {r.package_size_not_updated > 0 && (
        <li>
          <Typography variant="caption" color="warning.main">
            {r.package_size_not_updated} product(s) had an unrecognized package size — left
            unchanged, everything else on those rows was still updated
          </Typography>
        </li>
      )}
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Products from CSV</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Upload your rate/stock sheet — columns P_CODE, BARCODE, package_size, BRAND_NAME,
            BR_CODE, our_price, product_mrp, quantity, store_code_status — to refresh price,
            stock, and active/inactive status for every p_code it mentions.
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
              ' — no store selected, so BR_CODE in the file decides each row\'s store.'
            )}
          </Alert>

          <FormControlLabel
            control={<Switch checked={syncMode} onChange={(e) => setSyncMode(e.target.checked)} />}
            label="Full daily sync"
          />
          <Typography variant="caption" color={syncMode ? 'text.secondary' : 'warning.main'} sx={{ mt: -1.5 }}>
            {syncMode
              ? "Also creates a product the first time a store carries it, and deactivates any product not in today's file for its store — for a sheet that always lists everything currently active."
              : "Off: only updates p_codes already in the catalog — nothing is created or deactivated for being absent from the file. Only turn this off if your file can genuinely mark a row 'N'; if it only ever says 'Y' (the normal case), a product missing from today's file will stay active forever instead of going inactive."}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button component="label" variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />}>
              {file ? file.name : 'Choose CSV file'}
              <input type="file" accept=".csv" hidden onChange={handleFileSelected} />
            </Button>
            {syncMode && (
              <Button variant="text" disabled={!file || previewing} onClick={handlePreview}>
                {previewing ? 'Previewing…' : 'Preview (no changes made)'}
              </Button>
            )}
          </Stack>

          {preview && (
            <Alert severity="info">
              Preview — updates {preview.updated}, creates {preview.created ?? 0}, deactivates{' '}
              {preview.deactivated ?? 0} of {preview.total_rows} row(s). Nothing has been written
              yet.
              {renderCounts(preview)}
              {!!preview.deactivation_blocked?.length && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                  {preview.deactivation_blocked
                    .map(
                      (b) =>
                        `${b.store_code}: would deactivate ${b.would_deactivate} of ${b.active_count} active (${Math.round(b.ratio * 100)}%) — held back, more than half the store's catalog`
                    )
                    .join('; ')}
                </Typography>
              )}
            </Alert>
          )}

          {result && (
            <Alert severity={result.deactivation_blocked?.length ? 'warning' : (result.skipped_not_found > 0 ? 'warning' : 'success')}>
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
              {renderCounts(result)}
              {!!result.deactivation_blocked?.length && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>
                    Held back — deactivating would drop more than half of these stores&apos;
                    currently-active catalog, likely a partial file:{' '}
                    {result.deactivation_blocked
                      .map(
                        (b) =>
                          `${b.store_code} (${b.would_deactivate} of ${b.active_count}, ${Math.round(b.ratio * 100)}%)`
                      )
                      .join(', ')}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={uploading}
                    onClick={() => handleUpload(true)}
                  >
                    This is correct — deactivate anyway
                  </Button>
                </Box>
              )}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          {result && !result.deactivation_blocked?.length ? 'Close' : 'Cancel'}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleUpload(false)}
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? 'Updating…' : 'Upload & Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
