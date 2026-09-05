import type { BulkPoolUploadResult } from 'src/services/image-cdn';
import type { ImageSyncRun, ImageCdnCoverage, ImageCdnMissingProduct } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { getSelectedProjectCode } from 'src/utils/project-code';

import { CONFIG } from 'src/config-global';
import {
  getImageCdnRuns,
  runImageCdnSync,
  bulkUploadToPool,
  getImageCdnMissing,
  getImageCdnCoverage,
  uploadImageCdnImage,
} from 'src/services/image-cdn';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

// One CSV field, quoted only when it needs to be (a bare number like a
// p_code or barcode reads fine unquoted; a product name can contain a comma
// or a quote, so those always get quoted-and-escaped).
function csvField(value: string | undefined): string {
  const s = value ?? '';
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: ImageCdnMissingProduct[]) {
  const lines = [
    'p_code,product_name,barcode',
    ...rows.map((r) => [csvField(r.p_code), csvField(r.product_name), csvField(r.barcode)].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatTile({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' }) {
  return (
    <Card sx={{ p: 2.5, flex: 1, minWidth: 150 }}>
      <Typography
        variant="h4"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          color: tone === 'good' ? 'success.main' : tone === 'bad' ? 'error.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {label}
      </Typography>
    </Card>
  );
}

function BulkPoolUploadCard() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<BulkPoolUploadResult | null>(null);
  const [error, setError] = useState('');

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []));
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    try {
      setUploading(true);
      setError('');
      setResult(null);
      setProgress({ done: 0, total: files.length });
      const res = await bulkUploadToPool(files, 15, (done, total) => setProgress({ done, total }));
      setResult(res);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">Bulk add to pool</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Restocks the shared image pool directly — not tied to this tenant. Files must already be
            named <code>&lt;barcode&gt;_1.jpg</code> (or <code>_2</code>, or bare{' '}
            <code>&lt;barcode&gt;.jpg</code>). Run &quot;Sync now&quot; afterwards to pick up matches
            for this tenant.
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button component="label" variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />}>
            {files.length > 0 ? `${files.length} file(s) selected` : 'Choose photos'}
            <input type="file" accept="image/*" multiple hidden onChange={handleFilesSelected} />
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          >
            {uploading
              ? `Uploading ${progress?.done ?? 0}/${progress?.total ?? files.length}…`
              : `Upload ${files.length || ''}`.trim()}
          </Button>
        </Stack>

        {result && (
          <Alert severity={result.skipped.length ? 'warning' : 'success'}>
            Added {result.saved.length} image(s) to the pool
            {result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.
            {result.skipped.length > 0 && (
              <Box component="ul" sx={{ m: '8px 0 0', pl: 2.5 }}>
                {result.skipped.slice(0, 10).map((s) => (
                  <li key={s.filename}>
                    <Typography variant="caption">
                      {s.filename} — {s.reason}
                    </Typography>
                  </li>
                ))}
                {result.skipped.length > 10 && (
                  <li>
                    <Typography variant="caption">…and {result.skipped.length - 10} more</Typography>
                  </li>
                )}
              </Box>
            )}
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

type UploadTarget = { p_code: string; product_name: string } | null;

function UploadDialog({
  target,
  onClose,
  onUploaded,
}: {
  target: UploadTarget;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [suffix, setSuffix] = useState<1 | 2>(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFile(null);
    setSuffix(1);
    setError('');
  }, [target]);

  const handleUpload = async () => {
    if (!target || !file) return;
    try {
      setUploading(true);
      setError('');
      await uploadImageCdnImage(target.p_code, suffix, file);
      onUploaded();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add image — {target?.p_code}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {target?.product_name}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={suffix === 1 ? 'contained' : 'outlined'}
              onClick={() => setSuffix(1)}
            >
              Primary
            </Button>
            <Button
              size="small"
              variant={suffix === 2 ? 'contained' : 'outlined'}
              onClick={() => setSuffix(2)}
            >
              Secondary
            </Button>
          </Stack>

          <Button component="label" variant="outlined" startIcon={<Iconify icon="mingcute:add-line" />}>
            {file ? file.name : 'Choose photo'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Page() {
  const [coverage, setCoverage] = useState<ImageCdnCoverage | null>(null);
  const [missing, setMissing] = useState<ImageCdnMissingProduct[]>([]);
  const [runs, setRuns] = useState<ImageSyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [coverageRes, missingRes, runsRes] = await Promise.all([
        getImageCdnCoverage(),
        getImageCdnMissing(200),
        getImageCdnRuns(10),
      ]);
      setCoverage(coverageRes.data);
      setMissing(missingRes.data);
      setRuns(runsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load image CDN status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError('');
      await runImageCdnSync();
      await load();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  // Exports the FULL missing list, not just the (possibly truncated) 200
  // rows held in state for the on-screen table — a fresh, uncapped fetch so
  // the CSV always matches the real "Missing" stat tile above it.
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      setError('');
      const res = await getImageCdnMissing(10000);
      const projectCode = getSelectedProjectCode() || 'export';
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`${projectCode}-missing-images-${stamp}.csv`, res.data);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatRunTime = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <title>{`Image CDN - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4">Image CDN</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Product photos, matched from the shared barcode pool and copied into this
                tenant&apos;s public store. Sync is manual — nothing runs on its own.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleSync}
              disabled={syncing || loading}
              startIcon={syncing ? <CircularProgress size={16} /> : <Iconify icon="solar:restart-bold" />}
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <StatTile label="Products in catalog" value={coverage?.total ?? 0} />
                <StatTile label="Matched (primary)" value={coverage?.matched_primary ?? 0} tone="good" />
                <StatTile label="Matched (secondary)" value={coverage?.matched_secondary ?? 0} />
                <StatTile label="Missing" value={coverage?.missing ?? 0} tone="bad" />
                <StatTile label="Coverage" value={`${coverage?.coverage_pct ?? 0}%`} />
              </Stack>

              <BulkPoolUploadCard />

              <Card>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, pb: 1.5 }}>
                  <Typography variant="h6">Missing images</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {missing.length} shown
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleExportCsv}
                      disabled={exporting || (coverage?.missing ?? 0) === 0}
                      startIcon={
                        exporting ? <CircularProgress size={14} /> : <Iconify icon="eva:arrow-ios-downward-fill" />
                      }
                    >
                      {exporting ? 'Exporting…' : 'Export CSV'}
                    </Button>
                  </Stack>
                </Stack>
                <Scrollbar sx={{ maxHeight: 480 }}>
                  <TableContainer sx={{ overflow: 'unset' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>P-Code</TableCell>
                          <TableCell>Product</TableCell>
                          <TableCell>Barcode</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {missing.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                              Nothing missing — every product has a primary image.
                            </TableCell>
                          </TableRow>
                        ) : (
                          missing.map((product) => (
                            <TableRow key={product.p_code} hover>
                              <TableCell sx={{ fontFamily: 'monospace' }}>{product.p_code}</TableCell>
                              <TableCell>{product.product_name}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                {product.barcode || '—'}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setUploadTarget({ p_code: product.p_code, product_name: product.product_name })
                                  }
                                >
                                  <Iconify icon="mingcute:add-line" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Scrollbar>
              </Card>

              <Card>
                <Typography variant="h6" sx={{ p: 2.5, pb: 1.5 }}>
                  Recent syncs
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>By</TableCell>
                        <TableCell align="right">Matched</TableCell>
                        <TableCell align="right">Missing</TableCell>
                        <TableCell align="right">Duration</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {runs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No syncs yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        runs.map((run) => (
                          <TableRow key={run._id}>
                            <TableCell>{formatRunTime(run.ran_at)}</TableCell>
                            <TableCell>{run.triggered_by_email || '—'}</TableCell>
                            <TableCell align="right">{run.matched_primary}</TableCell>
                            <TableCell align="right">{run.missing_count}</TableCell>
                            <TableCell align="right">
                              {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </>
          )}
        </Stack>
      </Container>

      <UploadDialog
        target={uploadTarget}
        onClose={() => setUploadTarget(null)}
        onUploaded={() => {
          setUploadTarget(null);
          load();
        }}
      />
    </>
  );
}
