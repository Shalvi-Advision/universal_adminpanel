import type { Faq, ContentPage } from 'src/services/content';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  getContentPages,
  saveContentPage,
  APP_CONTENT_SLUGS,
} from 'src/services/content';

import { Iconify } from 'src/components/iconify';
import { PermissionButton } from 'src/components/permission-button/permission-button';

// ----------------------------------------------------------------------

type PageDraft = { slug: string; title: string; html: string; is_active: boolean };
type FaqDraft = { question: string; answer: string; category: string; is_active: boolean };

const EMPTY_FAQ: FaqDraft = { question: '', answer: '', category: 'General', is_active: true };

/** Strips tags for the list preview — the body is HTML, the summary should not be. */
const plain = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

// ----------------------------------------------------------------------

export default function Page() {
  const [tab, setTab] = useState(0);

  const [pages, setPages] = useState<ContentPage[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [pageDraft, setPageDraft] = useState<PageDraft | null>(null);
  const [faqDraft, setFaqDraft] = useState<FaqDraft>(EMPTY_FAQ);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [pageRes, faqRes] = await Promise.all([getContentPages(), getFaqs()]);
      if (pageRes.success) setPages(pageRes.data);
      if (faqRes.success) setFaqs(faqRes.data);
    } catch (err: any) {
      setError(err?.message || 'Could not load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Every slug the app asks for, whether or not a row exists yet — an unsaved
  // page must still be visible and editable, otherwise the only way to create
  // one is to already have it.
  const pageRows = APP_CONTENT_SLUGS.map((known) => {
    const existing = pages.find((p) => p.slug === known.slug);
    return {
      ...known,
      existing,
      html: existing?.html ?? '',
      is_active: existing?.is_active ?? true,
      savedTitle: existing?.title ?? known.title,
    };
  });

  // Slugs saved in the database that the app never requests. Worth surfacing:
  // they look like working pages in a list and are read by nothing.
  const orphanPages = pages.filter(
    (p) => !APP_CONTENT_SLUGS.some((k) => k.slug === p.slug)
  );

  const handleSavePage = async () => {
    if (!pageDraft) return;
    try {
      setBusy(true);
      await saveContentPage(pageDraft.slug, {
        title: pageDraft.title.trim(),
        html: pageDraft.html,
        is_active: pageDraft.is_active,
      });
      setToast(`Saved “${pageDraft.title.trim()}”`);
      setPageDraft(null);
      await fetchAll();
    } catch (err: any) {
      setError(err?.message || 'Could not save the page');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveFaq = async () => {
    try {
      setBusy(true);
      const payload = {
        question: faqDraft.question.trim(),
        answer: faqDraft.answer.trim(),
        category: faqDraft.category.trim() || 'General',
        is_active: faqDraft.is_active,
      };
      if (editingFaq) {
        await updateFaq(editingFaq._id, payload);
        setToast('FAQ updated');
      } else {
        // New questions go to the end rather than the top, so adding one never
        // silently reorders what is already there.
        const nextSequence = faqs.reduce((max, f) => Math.max(max, f.sequence), 0) + 1;
        await createFaq({ ...payload, sequence: nextSequence });
        setToast('FAQ added');
      }
      setFaqDialogOpen(false);
      setEditingFaq(null);
      setFaqDraft(EMPTY_FAQ);
      await fetchAll();
    } catch (err: any) {
      setError(err?.message || 'Could not save the FAQ');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteFaq = async (faq: Faq) => {
    try {
      setBusy(true);
      await deleteFaq(faq._id);
      setToast('FAQ deleted');
      await fetchAll();
    } catch (err: any) {
      setError(err?.message || 'Could not delete the FAQ');
    } finally {
      setBusy(false);
    }
  };

  /** Swaps a question with its neighbour and persists both sequences. */
  const handleMoveFaq = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;

    const reordered = [...faqs];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setFaqs(reordered); // optimistic: the arrows should feel instant

    try {
      setBusy(true);
      await reorderFaqs(reordered.map((f, i) => ({ id: f._id, sequence: i })));
    } catch (err: any) {
      setError(err?.message || 'Could not save the new order');
      await fetchAll(); // put the server's order back
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h4">Content</Typography>
        <Button color="inherit" startIcon={<Iconify icon="solar:restart-bold" />} onClick={fetchAll}>
          Refresh
        </Button>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Help &amp; Support, Refund/Terms and Policies, About Us and the FAQ, as they appear in the
        mobile app menu.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Pages (${pageRows.filter((r) => r.existing).length}/${pageRows.length})`} />
        <Tab label={`FAQ (${faqs.length})`} />
      </Tabs>

      {tab === 0 && (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Page</TableCell>
                <TableCell>Appears in</TableCell>
                <TableCell>Content</TableCell>
                <TableCell align="right">Status</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => (
                <TableRow key={row.slug} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{row.savedTitle}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {row.where}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                      {plain(row.html) || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {!row.existing ? (
                      <Chip size="small" color="warning" label="Not set" />
                    ) : row.is_active ? (
                      <Chip size="small" color="success" label="Live" />
                    ) : (
                      <Chip size="small" label="Hidden" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <PermissionButton section="dynamicSection" action="edit">
                      <Button
                        size="small"
                        onClick={() =>
                          setPageDraft({
                            slug: row.slug,
                            title: row.savedTitle,
                            html: row.html,
                            is_active: row.is_active,
                          })
                        }
                      >
                        Edit
                      </Button>
                    </PermissionButton>
                  </TableCell>
                </TableRow>
              ))}

              {orphanPages.map((page) => (
                <TableRow key={page.slug} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{page.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {page.slug}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={2}>
                    <Tooltip title="The mobile app does not request this slug, so nothing displays it.">
                      <Chip size="small" color="default" label="Unused by the app" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Chip size="small" label={page.is_active ? 'Live' : 'Hidden'} />
                  </TableCell>
                  <TableCell align="right">
                    <PermissionButton section="dynamicSection" action="edit">
                      <Button
                        size="small"
                        onClick={() =>
                          setPageDraft({
                            slug: page.slug,
                            title: page.title,
                            html: page.html,
                            is_active: page.is_active,
                          })
                        }
                      >
                        Edit
                      </Button>
                    </PermissionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
            <PermissionButton section="dynamicSection" action="create">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  setEditingFaq(null);
                  setFaqDraft(EMPTY_FAQ);
                  setFaqDialogOpen(true);
                }}
              >
                Add question
              </Button>
            </PermissionButton>
          </Stack>

          {faqs.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No questions yet. The app falls back to its built-in list until you add some.
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Order</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {faqs.map((faq, index) => (
                  <TableRow key={faq._id} hover>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="subtitle2">{faq.question}</Typography>
                      <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                        {faq.answer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={faq.category} />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        color={faq.is_active ? 'success' : 'default'}
                        label={faq.is_active ? 'Live' : 'Hidden'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        disabled={busy || index === 0}
                        onClick={() => handleMoveFaq(index, -1)}
                      >
                        <Iconify icon="eva:arrow-ios-upward-fill" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={busy || index === faqs.length - 1}
                        onClick={() => handleMoveFaq(index, 1)}
                      >
                        <Iconify icon="eva:arrow-ios-downward-fill" />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      <PermissionButton section="dynamicSection" action="edit">
                        <Button
                          size="small"
                          onClick={() => {
                            setEditingFaq(faq);
                            setFaqDraft({
                              question: faq.question,
                              answer: faq.answer,
                              category: faq.category,
                              is_active: faq.is_active,
                            });
                            setFaqDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </PermissionButton>
                      <PermissionButton section="dynamicSection" action="delete">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={busy}
                          onClick={() => handleDeleteFaq(faq)}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </PermissionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* ---- edit a content page ---- */}
      <Dialog open={Boolean(pageDraft)} onClose={() => setPageDraft(null)} fullWidth maxWidth="md">
        <DialogTitle>{pageDraft?.title || 'Edit page'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              The body is HTML — the app renders tags like <code>&lt;h2&gt;</code>,{' '}
              <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code> and <code>&lt;strong&gt;</code>. Plain
              text works too.
            </Alert>
            <TextField
              label="Title"
              value={pageDraft?.title ?? ''}
              onChange={(e) => setPageDraft((d) => (d ? { ...d, title: e.target.value } : d))}
              fullWidth
            />
            <TextField
              label="Content (HTML)"
              value={pageDraft?.html ?? ''}
              onChange={(e) => setPageDraft((d) => (d ? { ...d, html: e.target.value } : d))}
              fullWidth
              multiline
              minRows={12}
              slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: 13 } } }}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={pageDraft?.is_active ?? true}
                onChange={(e) =>
                  setPageDraft((d) => (d ? { ...d, is_active: e.target.checked } : d))
                }
              />
              <Typography variant="body2">
                Visible in the app{' '}
                <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                  (off hides it — the screen then shows its built-in text)
                </Typography>
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setPageDraft(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy || !pageDraft?.title.trim()}
            onClick={handleSavePage}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---- add / edit an FAQ ---- */}
      <Dialog
        open={faqDialogOpen}
        onClose={() => setFaqDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingFaq ? 'Edit question' : 'Add question'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Question"
              value={faqDraft.question}
              onChange={(e) => setFaqDraft((d) => ({ ...d, question: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Answer"
              value={faqDraft.answer}
              onChange={(e) => setFaqDraft((d) => ({ ...d, answer: e.target.value }))}
              fullWidth
              multiline
              minRows={4}
            />
            <TextField
              label="Category"
              value={faqDraft.category}
              onChange={(e) => setFaqDraft((d) => ({ ...d, category: e.target.value }))}
              fullWidth
              select
              helperText="Questions are grouped under this heading in the app"
            >
              {Array.from(
                new Set([
                  ...faqs.map((f) => f.category),
                  'General',
                  'Products',
                  'Ordering & Payment',
                  'Delivery',
                  'Returns & Refunds',
                  'Account',
                ])
              ).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={faqDraft.is_active}
                onChange={(e) => setFaqDraft((d) => ({ ...d, is_active: e.target.checked }))}
              />
              <Typography variant="body2">Show in the app</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setFaqDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={busy || !faqDraft.question.trim() || !faqDraft.answer.trim()}
            onClick={handleSaveFaq}
          >
            {editingFaq ? 'Save' : 'Add'}
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
