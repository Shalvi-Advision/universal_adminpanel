import type { PaymentRecoveryCase, PaymentRecoveryStatus } from 'src/services/payment-recovery';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import { getPaymentRecoveryCases } from 'src/services/payment-recovery';

import { Scrollbar } from 'src/components/scrollbar';

import { PaymentRecoveryCaseDialog } from 'src/sections/payment-recovery/case-dialog';

// ----------------------------------------------------------------------

const TABS: { value: PaymentRecoveryStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const STATUS_COLORS: Record<PaymentRecoveryStatus, string> = {
  open: '#FFAB00',
  resolved: '#22C55E',
  dismissed: '#9E9E9E',
};

export default function PaymentRecoveryPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('paymentRecovery', 'edit');

  const [cases, setCases] = useState<PaymentRecoveryCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PaymentRecoveryStatus>('open');

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getPaymentRecoveryCases({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter,
      });
      if (response.success) {
        setCases(response.data);
        setTotalCount(response.pagination.total);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment recovery cases');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleTabChange = (_event: React.SyntheticEvent, value: PaymentRecoveryStatus) => {
    setStatusFilter(value);
    setPage(0);
  };

  const openCase = (recoveryCase: PaymentRecoveryCase) => {
    setSelectedCaseId(recoveryCase._id);
    setDialogOpen(true);
  };

  const handleChanged = (message: string) => {
    setSuccessMessage(message);
    fetchCases();
  };

  return (
    <>
      <title>{`Payment Recovery - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4">Payment Recovery</Typography>
            <Typography variant="body2" color="text.secondary">
              Razorpay payments that were captured but never turned into an order — usually because
              the app lost its connection right after payment succeeded. Restore the order, refund
              the customer, or dismiss a false positive.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}

          <Card>
            <Tabs value={statusFilter} onChange={handleTabChange} sx={{ px: 2 }}>
              {TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  sx={{ '&.Mui-selected': { color: STATUS_COLORS[tab.value] } }}
                />
              ))}
            </Tabs>

            <Divider />

            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Captured</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Resolution</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : cases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No {statusFilter} cases
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      cases.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            {item.captured_at ? new Date(item.captured_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.customer_name || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.mobile_no || 'no mobile on file'}
                            </Typography>
                          </TableCell>
                          <TableCell>₹{item.amount}</TableCell>
                          <TableCell sx={{ textTransform: 'uppercase' }}>{item.method || '—'}</TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" label={item.source} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={item.status}
                              sx={{
                                textTransform: 'capitalize',
                                color: '#fff',
                                bgcolor: STATUS_COLORS[item.status],
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {item.resolution === 'order_created'
                              ? `Order #${item.resolved_order_number}`
                              : item.resolution
                                ? item.resolution
                                : '—'}
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" onClick={() => openCase(item)}>
                              {item.status === 'open' && canEdit ? 'Review' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(_event, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          </Card>
        </Stack>
      </Container>

      <PaymentRecoveryCaseDialog
        open={dialogOpen}
        caseId={selectedCaseId}
        canEdit={canEdit}
        onClose={() => setDialogOpen(false)}
        onChanged={handleChanged}
      />
    </>
  );
}
