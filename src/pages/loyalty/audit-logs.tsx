import type { LoyaltyAuditLog } from 'src/types/loyalty';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getLoyaltyAuditLogs } from 'src/services/loyalty';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function Page() {
  const [logs, setLogs] = useState<LoyaltyAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getLoyaltyAuditLogs({ page, limit: 30 });
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pagination.totalPages || res.pagination.pages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const performerLabel = (log: LoyaltyAuditLog) => {
    if (typeof log.performedBy === 'string') return log.performedBy;
    return log.performedBy?.name || log.performedBy?.mobile || 'Unknown';
  };

  return (
    <>
      <title>{`Loyalty · Audit Logs - ${CONFIG.appName}`}</title>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Audit Logs</Typography>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Target</TableCell>
                      <TableCell>Performed By</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>When</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" color="text.secondary">No audit entries yet</Typography>
                      </TableCell></TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log._id} hover>
                          <TableCell><Chip size="small" variant="outlined" label={log.action.replace(/_/g, ' ')} /></TableCell>
                          <TableCell>{log.targetType}</TableCell>
                          <TableCell>{performerLabel(log)}</TableCell>
                          <TableCell>{log.reason || '—'}</TableCell>
                          <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Card>

          {totalPages > 1 && (
            <Stack alignItems="center">
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Stack>
          )}
        </Stack>
      </Container>
    </>
  );
}
