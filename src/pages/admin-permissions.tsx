import type { User } from 'src/types/api';
import type { Project } from 'src/services/projects';
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
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
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
import { getProjects } from 'src/services/projects';
import { getAdminUsers, createAdmin, updateAdmin } from 'src/services/admin-permissions';

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
  { key: 'digitalCart', label: 'Digital Cart', actions: ['view', 'create', 'edit', 'delete'] },
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog state — mode 'edit' updates an existing admin, 'create' adds one
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'edit' | 'create'>('edit');
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(buildDefaultPermissions());
  const [editProjectCodes, setEditProjectCodes] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', mobile: '', email: '' });
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const [adminsRes, projectsRes] = await Promise.all([getAdminUsers(), getProjects()]);
      setAdmins(adminsRes.data as any);
      setProjects(projectsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenEdit = (admin: User) => {
    setDialogMode('edit');
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
    setEditProjectCodes(admin.allowed_project_codes || []);
    setDialogOpen(true);
    setSuccess('');
  };

  const handleOpenCreate = () => {
    setDialogMode('create');
    setSelectedAdmin(null);
    setEditPermissions(buildDefaultPermissions());
    setEditProjectCodes([]);
    setNewAdmin({ name: '', mobile: '', email: '' });
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

  const handleToggleProject = (code: string) => {
    setEditProjectCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (dialogMode === 'create') {
        if (!newAdmin.name.trim() || !/^\d{10}$/.test(newAdmin.mobile.trim())) {
          setError('Name and a valid 10-digit mobile number are required');
          return;
        }
        if (!editProjectCodes.length) {
          setError('Assign at least one project');
          return;
        }
        await createAdmin({
          name: newAdmin.name.trim(),
          mobile: newAdmin.mobile.trim(),
          email: newAdmin.email.trim() || undefined,
          permissions: editPermissions,
          allowed_project_codes: editProjectCodes,
        });
        setSuccess(`Admin ${newAdmin.name} created`);
      } else {
        if (!selectedAdmin?._id) return;
        if (!editProjectCodes.length) {
          setError('Assign at least one project');
          return;
        }
        await updateAdmin(selectedAdmin._id, {
          permissions: editPermissions,
          allowed_project_codes: editProjectCodes,
        });
        setSuccess(`Updated ${selectedAdmin.name || selectedAdmin.mobile}`);
      }

      setDialogOpen(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin');
    } finally {
      setSaving(false);
    }
  };

  const projectName = (code: string) =>
    projects.find((p) => p.project_code === code)?.client_name || code;

  return (
    <>
      <title>{`Admin Permissions | ${CONFIG.appName}`}</title>

      <Container maxWidth="lg">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4">Admin Permissions</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenCreate}
          >
            New Admin
          </Button>
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
                <Table sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Admin</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Projects</TableCell>
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
                              <Chip label="All Projects" color="success" size="small" variant="outlined" />
                            ) : (admin.allowed_project_codes || []).length ? (
                              (admin.allowed_project_codes || []).map((code) => (
                                <Chip
                                  key={code}
                                  label={projectName(code)}
                                  size="small"
                                  variant="outlined"
                                />
                              ))
                            ) : (
                              <Chip label="No access" color="error" size="small" variant="outlined" />
                            )}
                          </Stack>
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
                            <IconButton onClick={() => handleOpenEdit(admin)} title="Manage Access">
                              <Iconify icon="solar:settings-bold-duotone" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {admins.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
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

        {/* Admin Editor Dialog (create + edit) */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogMode === 'create'
              ? 'New Admin'
              : `Manage Access — ${selectedAdmin?.name || selectedAdmin?.mobile}`}
          </DialogTitle>
          <DialogContent dividers>
            {dialogMode === 'create' && (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, mt: 1 }}>
                  <TextField
                    label="Name"
                    fullWidth
                    size="small"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))}
                  />
                  <TextField
                    label="Mobile (10 digits)"
                    fullWidth
                    size="small"
                    value={newAdmin.mobile}
                    onChange={(e) => setNewAdmin((p) => ({ ...p, mobile: e.target.value }))}
                  />
                  <TextField
                    label="Email (optional)"
                    fullWidth
                    size="small"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin((p) => ({ ...p, email: e.target.value }))}
                  />
                </Stack>
                <Divider sx={{ mb: 2 }} />
              </>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Assigned Projects
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              The admin can only see and manage data of the selected clients. With a single
              project assigned, the panel locks to that client (no switcher).
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
              {projects.map((project) => {
                const checked = editProjectCodes.includes(project.project_code);
                return (
                  <Chip
                    key={project.project_code}
                    label={`${project.client_name} (${project.project_code})`}
                    color={checked ? 'primary' : 'default'}
                    variant={checked ? 'filled' : 'outlined'}
                    onClick={() => handleToggleProject(project.project_code)}
                    icon={checked ? <Iconify icon="eva:checkmark-fill" /> : undefined}
                  />
                );
              })}
            </Stack>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Section Permissions
            </Typography>
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
              {saving ? 'Saving...' : dialogMode === 'create' ? 'Create Admin' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
}
