import type { ProcurementReportRow } from 'src/services/reports';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getProcurementReport } from 'src/services/reports';

import { Iconify } from 'src/components/iconify';

// "2026-08-22" for today, in the browser's local timezone — matches what the
// <input type="date"> field itself would produce for "today".
const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const formatDateForDisplay = (iso: string) => {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
};

// Every cell boxed in solid black — same idea as the order Pick List
// (order-details-dialog.tsx), which uses 1px solid divider-colour borders on
// every cell rather than MUI's default row-separator-only look. This report
// asked for black specifically: it's meant to be printed, and a light grey
// divider can wash out to nearly invisible on some printers.
const cellSx = { py: 1, border: '1px solid', borderColor: 'common.black' };
const headCellSx = { ...cellSx, fontWeight: 700 };

// Same technique as the order Pick List (order-details-dialog.tsx): print
// relies on visibility rather than display so the page keeps its layout —
// everything is hidden, then only the report area is switched back on. "Export
// PDF" is window.print() with the browser's own Save as PDF destination —
// no PDF library needed, consistent with how the Pick List already does this.
const printStyles = (
  <GlobalStyles
    styles={{
      '.print-only': { display: 'none' },
      // Chrome/Edge/Firefox all default to roughly a 1in page margin, which
      // alone can be the difference between a 19-row report fitting on one
      // page and spilling one or two rows onto a near-empty second page.
      '@page': { margin: '10mm' },
      '@media print': {
        'body *': { visibility: 'hidden' },
        '.report-print-area, .report-print-area *': { visibility: 'visible' },
        '.report-print-area': {
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          padding: 0,
          boxShadow: 'none',
        },
        '.no-print': { display: 'none !important' },
        '.print-only': { display: 'block !important' },
        // Everything below trims vertical space the screen layout can afford
        // but a one-page print budget can't: gaps between sections, the
        // title, and — the biggest lever, since it's multiplied by every row
        // — cell padding and font size in the table itself.
        '.report-print-area .MuiStack-root': { gap: '4px !important' },
        '.report-print-area h4': { fontSize: '16px !important', margin: '0 !important' },
        '.report-print-area table': { fontSize: '10px' },
        '.report-print-area th, .report-print-area td': {
          padding: '2px 6px !important',
          lineHeight: 1.2,
        },
      },
    }}
  />
);

// Quotes every field so a product name with a comma in it (there are plenty
// — "Kantoli (Whole Vegetables)") can't be mistaken for a column break, and
// escapes literal quotes the way CSV requires.
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

const buildCsv = (rows: ProcurementReportRow[]) => {
  const header = ['Sr No.', 'P-Code', 'Product Name', 'Pack Size', 'Ordered Qty', 'Total Required Qty'];
  const lines = [
    header.map(csvCell).join(','),
    ...rows.map((row) =>
      [row.sr_no, row.p_code, row.product_name, row.pack_size, row.ordered_qty, row.total_required_qty]
        .map(csvCell)
        .join(',')
    ),
  ];
  return lines.join('\r\n');
};

const downloadCsv = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function Page() {
  const [date, setDate] = useState(todayIso());
  const [rows, setRows] = useState<ProcurementReportRow[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getProcurementReport(date);
      if (response.success) {
        setRows(response.data);
        setOrderCount(response.order_count);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load the procurement report');
      setRows([]);
      setOrderCount(0);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCsv = () => {
    downloadCsv(buildCsv(rows), `Item_procurement_data_${date.replace(/-/g, '')}.csv`);
  };

  const handleExportPdf = () => window.print();

  const totalOrderedQty = rows.reduce((sum, row) => sum + row.ordered_qty, 0);

  return (
    <>
      {printStyles}
      <title>{`Procurement Report - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }} className="report-print-area">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Procurement Report</Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
              className="no-print"
            >
              Total quantity of each product ordered on a given day, for restocking.
              Cancelled orders are excluded.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError('')} className="no-print">
              {error}
            </Alert>
          )}

          <Card>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              justifyContent="space-between"
              sx={{ p: 2 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                  className="no-print"
                />
                {/* The date field itself is hidden for print — this stands in
                    for it, so the printed page still says which day it's for. */}
                <Typography variant="subtitle2" className="print-only">
                  {formatDateForDisplay(date)}
                </Typography>
                {!loading && (
                  <Typography variant="body2" color="text.secondary">
                    {orderCount} order{orderCount === 1 ? '' : 's'} · {rows.length} product
                    {rows.length === 1 ? '' : 's'}
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={1.5} className="no-print">
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon={'solar:printer-bold-duotone' as any} />}
                  onClick={handleExportPdf}
                  disabled={loading || rows.length === 0}
                >
                  Export PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon={'solar:download-bold-duotone' as any} />}
                  onClick={handleDownloadCsv}
                  disabled={loading || rows.length === 0}
                >
                  Download CSV
                </Button>
              </Stack>
            </Stack>

            {/* Plain TableContainer (its own overflow-x: auto handles a
                narrow viewport), not the Scrollbar/simplebar wrapper used
                elsewhere — simplebar simulates scrolling via an internal
                transform rather than native overflow, and that transform
                doesn't reset for print: it left a scroll-offset-sized gap
                mid-table, silently hiding whichever rows it corresponded to,
                with nothing to indicate rows were missing. */}
            <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headCellSx}>Sr No.</TableCell>
                      <TableCell sx={headCellSx}>P-Code</TableCell>
                      <TableCell sx={headCellSx}>Product Name</TableCell>
                      <TableCell sx={headCellSx}>Pack Size</TableCell>
                      <TableCell sx={headCellSx} align="right">Ordered Qty</TableCell>
                      <TableCell sx={headCellSx}>Total Required Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No orders placed on this date
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {rows.map((row) => (
                          <TableRow key={row.p_code}>
                            <TableCell sx={cellSx}>{row.sr_no}</TableCell>
                            <TableCell sx={cellSx}>{row.p_code}</TableCell>
                            <TableCell sx={cellSx}>{row.product_name}</TableCell>
                            <TableCell sx={cellSx}>{row.pack_size}</TableCell>
                            <TableCell sx={cellSx} align="right">{row.ordered_qty}</TableCell>
                            <TableCell sx={cellSx}>{row.total_required_qty}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }} colSpan={4}>
                            Total
                          </TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }} align="right">
                            {totalOrderedQty}
                          </TableCell>
                          {/* Total Required Qty mixes units (Gm, Nos, ...) across
                              rows, so a single sum here would be meaningless. */}
                          <TableCell sx={cellSx} />
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
