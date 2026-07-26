import type { OnboardingSlide } from 'src/services/onboarding';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import {
  getOnboardingSlides,
  createOnboardingSlide,
  deleteOnboardingSlide,
  updateOnboardingSlide,
  reorderOnboardingSlides,
} from 'src/services/onboarding';

import { Iconify } from 'src/components/iconify';
import { ImageField } from 'src/components/project-settings/image-field';
import { PermissionButton } from 'src/components/permission-button/permission-button';

// ----------------------------------------------------------------------

const MAX_SLIDES = 10;

type DraftSlide = {
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

const EMPTY_DRAFT: DraftSlide = {
  title: '',
  description: '',
  image_url: '',
  is_active: true,
};

// ----------------------------------------------------------------------

export default function Page() {
  const [slides, setSlides] = useState<OnboardingSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [editing, setEditing] = useState<OnboardingSlide | null>(null);
  const [draft, setDraft] = useState<DraftSlide>(EMPTY_DRAFT);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getOnboardingSlides();
      if (response.success) setSlides(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load onboarding slides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  };

  const openEdit = (slide: OnboardingSlide) => {
    setEditing(slide);
    setDraft({
      title: slide.title,
      description: slide.description ?? '',
      image_url: slide.image_url,
      is_active: slide.is_active,
    });
    setDialogOpen(true);
  };

  const draftValid = draft.title.trim() !== '' && draft.image_url.trim() !== '';

  const handleSave = async () => {
    if (!draftValid) return;
    try {
      setBusy(true);
      setError('');
      if (editing) {
        await updateOnboardingSlide(editing._id, draft);
        setToast('Slide saved');
      } else {
        await createOnboardingSlide(draft);
        setToast('Slide added');
      }
      setDialogOpen(false);
      await fetchSlides();
    } catch (err: any) {
      setError(err.message || 'Failed to save slide');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (slide: OnboardingSlide) => {
    try {
      setBusy(true);
      setError('');
      await deleteOnboardingSlide(slide._id);
      setToast('Slide deleted');
      await fetchSlides();
    } catch (err: any) {
      setError(err.message || 'Failed to delete slide');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (slide: OnboardingSlide) => {
    try {
      setBusy(true);
      setError('');
      await updateOnboardingSlide(slide._id, { is_active: !slide.is_active });
      await fetchSlides();
    } catch (err: any) {
      setError(err.message || 'Failed to update slide');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const reordered = [...slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    // Optimistic: the list reorders under the cursor immediately, and a failed
    // write re-fetches the server's truth.
    setSlides(reordered);

    try {
      setBusy(true);
      await reorderOnboardingSlides(reordered.map((s) => s._id));
    } catch (err: any) {
      setError(err.message || 'Failed to reorder');
      await fetchSlides();
    } finally {
      setBusy(false);
    }
  };

  const activeCount = slides.filter((s) => s.is_active).length;

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Onboarding</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Slides shown on first launch of the mobile app, in this order.{' '}
            {activeCount === 0
              ? 'With none active the app skips onboarding entirely.'
              : `${activeCount} of ${slides.length} active.`}
          </Typography>
        </Box>
        <PermissionButton section="dynamicSection" action="create" fallback="disable">
          <Button
            variant="contained"
            disabled={busy || slides.length >= MAX_SLIDES}
            onClick={openCreate}
            startIcon={<Iconify icon={'mingcute:add-line' as any} />}
          >
            Add Slide
          </Button>
        </PermissionButton>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {slides.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Iconify
            icon={'solar:slider-horizontal-bold-duotone' as any}
            width={64}
            sx={{ color: 'text.disabled', mb: 2 }}
          />
          <Typography variant="h6">No onboarding slides yet</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Until you add one, the app shows its built-in slides.
          </Typography>
          <PermissionButton section="dynamicSection" action="create" fallback="disable">
            <Button variant="contained" onClick={openCreate}>
              Add the first slide
            </Button>
          </PermissionButton>
        </Card>
      ) : (
        <Stack spacing={2}>
          {slides.map((slide, index) => (
            <Card key={slide._id} sx={{ p: 2, opacity: slide.is_active ? 1 : 0.55 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Stack>
                  <IconButton
                    size="small"
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <Iconify icon={'eva:arrow-ios-upward-fill' as any} />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={busy || index === slides.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <Iconify icon={'eva:arrow-ios-downward-fill' as any} />
                  </IconButton>
                </Stack>

                <Box
                  component="img"
                  alt={slide.title}
                  src={slide.image_url}
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    bgcolor: 'background.neutral',
                  }}
                />

                <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" noWrap>
                      {slide.title}
                    </Typography>
                    <Chip size="small" label={`#${index + 1}`} />
                    {!slide.is_active && <Chip size="small" color="default" label="Hidden" />}
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {slide.description || <em>No description</em>}
                  </Typography>
                </Stack>

                <Tooltip title={slide.is_active ? 'Shown in the app' : 'Hidden from the app'}>
                  <Switch
                    checked={slide.is_active}
                    disabled={busy}
                    onChange={() => handleToggleActive(slide)}
                  />
                </Tooltip>

                <PermissionButton section="dynamicSection" action="edit" fallback="disable">
                  <IconButton disabled={busy} onClick={() => openEdit(slide)}>
                    <Iconify icon={'solar:pen-bold' as any} />
                  </IconButton>
                </PermissionButton>

                <PermissionButton section="dynamicSection" action="delete" fallback="disable">
                  <IconButton color="error" disabled={busy} onClick={() => handleDelete(slide)}>
                    <Iconify icon={'solar:trash-bin-trash-bold' as any} />
                  </IconButton>
                </PermissionButton>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit slide' : 'Add slide'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <ImageField
              label="Slide Image"
              value={draft.image_url}
              folder="onboarding"
              onChange={(url) => setDraft((prev) => ({ ...prev, image_url: url }))}
            />
            <TextField
              fullWidth
              size="small"
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              size="small"
              label="Description"
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                checked={draft.is_active}
                onChange={(e) => setDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <Typography variant="body2">Show this slide in the app</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" disabled={busy || !draftValid} onClick={handleSave}>
            {editing ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
      />
    </Container>
  );
}
