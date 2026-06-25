import type { Department } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';
import { deleteDepartment, getAllDepartments } from 'src/services/departments';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { PermissionButton } from 'src/components/permission-button/permission-button';

import { DepartmentDialog } from './components/department-dialog';
import { DeleteConfirmDialog } from '../dynamic/components/delete-confirm-dialog';

export default function Page() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllDepartments({
        page,
        limit,
        search: searchQuery || undefined,
        sortBy: 'sequence_id',
        sortOrder: 'asc',
      });
      if (response.success) {
        setDepartments(response.data);
        setTotalPages(response.pagination.pages || response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    setSelectedDepartment(null);
    setOpenDialog(true);
  };

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept);
    setOpenDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDepartment(deleteId);
      setOpenDeleteDialog(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleDialogSuccess = () => {
    setOpenDialog(false);
    fetchDepartments();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <>
      <title>{`Departments - ${CONFIG.appName}`}</title>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4">Departments</Typography>
            <PermissionButton section="ecommerce" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={handleCreate}
              >
                Create Department
              </Button>
            </PermissionButton>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Card>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Search by department name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Department</TableCell>
                      <TableCell>Department ID</TableCell>
                      <TableCell>Type ID</TableCell>
                      <TableCell>Store Code</TableCell>
                      <TableCell align="right">Sequence</TableCell>
                      <TableCell align="right">Columns</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : departments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No departments found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      departments.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={item.image_link}
                                alt={item.department_name}
                                variant="rounded"
                                sx={{ width: 48, height: 48 }}
                              />
                              <Typography variant="subtitle2">{item.department_name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.department_id} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.dept_type_id}</Typography>
                          </TableCell>
                          <TableCell>
                            {item.store_code ? (
                              <Chip label={item.store_code} size="small" variant="filled" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Global
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{item.sequence_id}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{item.dept_no_of_col}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <PermissionButton section="ecommerce" action="edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(item)}
                                color="primary"
                              >
                                <Iconify icon="solar:pen-bold" width={20} />
                              </IconButton>
                            </PermissionButton>
                            <PermissionButton section="ecommerce" action="delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(item._id)}
                                color="error"
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                              </IconButton>
                            </PermissionButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            {!loading && departments.length > 0 && (
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </Card>
        </Stack>
      </Container>

      <DepartmentDialog
        open={openDialog}
        department={selectedDepartment}
        onClose={() => setOpenDialog(false)}
        onSuccess={handleDialogSuccess}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message="Are you sure you want to delete this department? This action cannot be undone."
      />
    </>
  );
}
