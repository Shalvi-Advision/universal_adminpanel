import type { User } from 'src/types/api';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { getAllUsers } from 'src/services/users';

import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getAllUsers({ page: 1, limit: 100 });
        if (response.success) {
          setUsers(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <>
      <title>{`Users - ${CONFIG.appName}`}</title>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h4">Users</Typography>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Verified</TableCell>
                      <TableCell align="center">Push</TableCell>
                      <TableCell>Platform</TableCell>
                      <TableCell>Last Active</TableCell>
                      <TableCell align="center">Notifications</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user._id || user.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar alt={user.name || 'User'}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{user.name || 'N/A'}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {user.email || 'N/A'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{user.mobile || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.role ? user.role.toUpperCase() : 'USER'}
                              color={user.role === 'admin' ? 'primary' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              variant="outlined"
                              label={user.isVerified ? 'Verified' : 'Pending'}
                              color={user.isVerified ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={user.pushEnabled ? 'Push notifications enabled' : 'Push notifications not enabled'}>
                              <Chip
                                label={user.pushEnabled ? '✓' : '✗'}
                                color={user.pushEnabled ? 'success' : 'default'}
                                size="small"
                                sx={{ minWidth: 32 }}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {user.platform ? (
                              <Chip
                                label={user.platform}
                                variant="outlined"
                                size="small"
                                color={user.platform === 'web' ? 'info' : user.platform === 'android' ? 'success' : 'warning'}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={user.lastActiveAt || 'Never active'}>
                              <Typography variant="body2" color={user.lastActiveAt ? 'text.primary' : 'text.secondary'}>
                                {formatRelativeTime(user.lastActiveAt)}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={`Total: ${user.notificationCount || 0}, Unread: ${user.unreadNotificationCount || 0}`}>
                              <Badge badgeContent={user.unreadNotificationCount || 0} color="error" max={99}>
                                <Chip
                                  label={user.notificationCount || 0}
                                  variant="outlined"
                                  size="small"
                                />
                              </Badge>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? formatDate(user.createdAt) : '-'}
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
    </>
  );
}

