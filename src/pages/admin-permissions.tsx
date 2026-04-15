import type { User } from 'src/types/api';
import type { UserPermissions, PermissionSection } from 'src/types/permissions';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
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

import { CONFIG } from 'src/config-global';
import { getAdminUsers, updateAdminPermissions } from 'src/services/admin-permissions';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const SECTIONS: { key: PermissionSection; label: string; actions: string[] }[] = [
  { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
  { key: 'users', label: 'Users', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'orders', label: 'Orders', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'notifications', label: 'Notifications', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'ecommerce', label: 'Ecommerce', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'outlet', label: 'Outlet', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'dynamicSection', label: 'Dynamic Section', actions: ['view', 'create', 'edit', 'delete'] },
  { key: 'offers', label: 'Offers', actions: ['view', 'create', 'edit', 'delete'] },
];

const ALL_ACTIONS = ['view', 'create', 'edit', 'delete'];

function buildDefaultPermissions(): UserPermissions {
  const perms: any = {};
  for (const s of SECTIONS) {
    perms[s.key] = {};
    for (const a of s.actions) {
      perms[s.key][a] = false;
    }
  }
  return perms;
}

export default function AdminPermissionsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(buildDefaultPermissions());
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAdminUsers();
      setAdmins(response.data as any);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenDialog = (admin: User) => {
    setSelectedAdmin(admin);
    // Deep copy permissions, merging with defaults for any missing keys
    const defaults = buildDefaultPermissions();
    const existing = admin.permissions || {};
    const merged: any = {};
    for (const s of SECTIONS) {
      merged[s.key] = {};
      for (const a of s.actions) {
        merged[s.key][a] = (existing as any)[s.key]?.[a] ?? (defaults as any)[s.key]?.[a] ?? false;
      }
    }
    setEditPermissions(merged);
    setDialogOpen(true);
    setSuccess('');
  };

  const handleToggle = (section: PermissionSection, action: string) => {
    setEditPermissions((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [action]: !(prev[section] as any)?.[action],
      },
    }));
  };

  const handleSelectAll = (section: PermissionSection) => {
    const sectionConfig = SECTIONS.find((s) => s.key === section);
    if (!sectionConfig) return;
    const current = editPermissions[section] || {};
    const allEnabled = sectionConfig.actions.every((a) => (current as any)[a]);
    const updated: any = {};
    for (const a of sectionConfig.actions) {
      updated[a] = !allEnabled;
    }
    setEditPermissions((prev) => ({ ...prev, [section]: updated }));
  };

  const handleSave = async () => {
    if (!selectedAdmin?._id) return;
    try {
      setSaving(true);
      setError('');
      await updateAdminPermissions(selectedAdmin._id, editPermissions);
      setSuccess(`Permissions updated for ${selectedAdmin.name || selectedAdmin.mobile}`);
      setDialogOpen(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <title>{`Admin Permissions | ${CONFIG.appName}`}</title>

      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Admin Permissions</Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Admin</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Permissions Summary</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin._id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: admin.isSuperAdmin ? 'warning.main' : 'primary.main' }}>
                              {(admin.name || 'A')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {admin.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {admin.email || 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{admin.mobile}</TableCell>
                        <TableCell>
                          {admin.isSuperAdmin ? (
                            <Chip label="SUPER ADMIN" color="warning" size="small" />
                          ) : (
                            <Chip label="ADMIN" color="primary" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {admin.isSuperAdmin ? (
                              <Chip label="Full Access" color="success" size="small" variant="outlined" />
                            ) : (
                              SECTIONS.filter(
                                (s) => (admin.permissions as any)?.[s.key]?.view
                              ).map((s) => (
                                <Chip
                                  key={s.key}
                                  label={s.label}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                />
                              ))
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          {admin.isSuperAdmin ? (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              Full access
                            </Typography>
                          ) : (
                            <IconButton onClick={() => handleOpenDialog(admin)} title="Manage Permissions">
                              <Iconify icon="solar:settings-bold-duotone" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {admins.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No admin users found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          )}
        </Card>

        {/* Permission Editor Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Manage Permissions — {selectedAdmin?.name || selectedAdmin?.mobile}
          </DialogTitle>
          <DialogContent dividers>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Section</TableCell>
                  {ALL_ACTIONS.map((action) => (
                    <TableCell key={action} align="center" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {action}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>All</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SECTIONS.map((section) => (
                  <TableRow key={section.key}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {section.label}
                      </Typography>
                    </TableCell>
                    {ALL_ACTIONS.map((action) => (
                      <TableCell key={action} align="center">
                        {section.actions.includes(action) ? (
                          <Switch
                            size="small"
                            checked={(editPermissions[section.key] as any)?.[action] ?? false}
                            onChange={() => handleToggle(section.key, action)}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            —
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">
                      <Switch
                        size="small"
                        checked={section.actions.every(
                          (a) => (editPermissions[section.key] as any)?.[a]
                        )}
                        onChange={() => handleSelectAll(section.key)}
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
