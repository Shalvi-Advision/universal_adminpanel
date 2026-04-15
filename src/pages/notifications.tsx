import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { CONFIG } from 'src/config-global';
import { usePermissions } from 'src/contexts/permissions-context';
import {
    sendNotificationToAll,
    getUsersWithFcmTokens,
    sendNotificationToUser,
} from 'src/services/notifications';

// ----------------------------------------------------------------------

export default function Page() {
    const { hasPermission } = usePermissions();
    const canSendNotifications = hasPermission('notifications', 'create');

    const [target, setTarget] = useState<'user' | 'all'>('all');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const response = await getUsersWithFcmTokens();
                if (response.success) {
                    setUsers(response.data);
                }
            } catch (err: any) {
                console.error('Failed to load users:', err);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!title.trim() || !body.trim()) {
            setError('Title and message are required');
            return;
        }

        if (target === 'user' && !selectedUserId) {
            setError('Please select a user');
            return;
        }

        try {
            setLoading(true);
            let response;

            if (target === 'user') {
                response = await sendNotificationToUser({
                    userId: selectedUserId,
                    title,
                    body,
                });
            } else {
                response = await sendNotificationToAll({
                    title,
                    body,
                });
            }

            if (response.success) {
                setSuccess(response.message);
                // Reset form
                setTitle('');
                setBody('');
                setSelectedUserId('');
            } else {
                setError(response.message || 'Failed to send notification');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <title>{`Push Notifications - ${CONFIG.appName}`}</title>

            <Container maxWidth="md" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Typography variant="h4">Send Push Notifications</Typography>

                    {success && (
                        <Alert severity="success" onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <Card sx={{ p: 3 }}>
                        <Box component="form" onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                <FormControl>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Send To
                                    </Typography>
                                    <RadioGroup
                                        row
                                        value={target}
                                        onChange={(e) => setTarget(e.target.value as 'user' | 'all')}
                                    >
                                        <FormControlLabel value="all" control={<Radio />} label="All Users" />
                                        <FormControlLabel value="user" control={<Radio />} label="Specific User" />
                                    </RadioGroup>
                                </FormControl>

                                {target === 'user' && (
                                    <FormControl fullWidth>
                                        <InputLabel id="user-select-label">Select User</InputLabel>
                                        <Select
                                            labelId="user-select-label"
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            label="Select User"
                                            disabled={loadingUsers}
                                        >
                                            {loadingUsers ? (
                                                <MenuItem disabled>
                                                    <CircularProgress size={20} sx={{ mr: 2 }} />
                                                    Loading users...
                                                </MenuItem>
                                            ) : users.length === 0 ? (
                                                <MenuItem disabled>No users with notification tokens found</MenuItem>
                                            ) : (
                                                users.map((user) => (
                                                    <MenuItem key={user._id || user.id} value={user._id || user.id}>
                                                        {user.name || 'N/A'} - {user.mobile}
                                                        {user.email && ` (${user.email})`}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                )}

                                <TextField
                                    label="Notification Title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    fullWidth
                                    placeholder="Enter notification title"
                                />

                                <TextField
                                    label="Notification Message"
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    required
                                    fullWidth
                                    multiline
                                    rows={4}
                                    placeholder="Enter notification message"
                                />

                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => {
                                            setTitle('');
                                            setBody('');
                                            setSelectedUserId('');
                                            setError('');
                                            setSuccess('');
                                        }}
                                        disabled={loading}
                                    >
                                        Clear
                                    </Button>
                                    <LoadingButton type="submit" variant="contained" loading={loading} disabled={!canSendNotifications}>
                                        Send Notification
                                    </LoadingButton>
                                </Box>
                            </Stack>
                        </Box>
                    </Card>

                    <Card sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6">Statistics</Typography>
                            <Stack direction="row" spacing={3}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Users with Tokens
                                    </Typography>
                                    <Typography variant="h4">{users.length}</Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Card>
                </Stack>
            </Container>
        </>
    );
}
