import type { StoreCode } from 'src/types/api';
import type {
  HomeSection,
  FeedSection,
  SourceOption,
  HomeSectionInput,
} from 'src/services/home-sections';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { getStoreCodes } from 'src/services/store-codes';
import {
  previewHomeFeed,
  getHomeSections,
  createHomeSection,
  deleteHomeSection,
  updateHomeSection,
  adoptCurrentLayout,
  reorderHomeSections,
} from 'src/services/home-sections';

import { Iconify } from 'src/components/iconify';
import { ColorField } from 'src/components/project-settings/color-field';
import { PhonePreview } from 'src/components/phone-preview/phone-preview';
import { HomeSectionBlock } from 'src/components/phone-preview/home-section-block';
import { PermissionButton } from 'src/components/permission-button/permission-button';

// ----------------------------------------------------------------------

// Human labels and the source collection each type reads from. Types absent
// from SOURCE_BY_TYPE take no source at all.
const TYPE_LABELS: Record<string, string> = {
  hero_carousel: 'Hero banners',
  banner_strip: 'Banner strip',
  category_strip: 'Category strip',
  category_grid: 'Category grid',
  product_rail: 'Product rail',
  offer_strip: 'Offer strip',
  seasonal_picks: 'Seasonal picks',
  flash_sale: 'Flash sale',
  deal_of_day: 'Deal of the day',
  buy_again: 'Buy again',
  recently_viewed: 'Recently viewed',
  free_delivery_progress: 'Free delivery nudge',
  coupon_strip: 'Coupon strip',
  brand_strip: 'Brand strip',
  usp_strip: 'Trust badges',
};

const SOURCE_BY_TYPE: Record<string, string> = {
  category_strip: 'popular_categories',
  category_grid: 'popular_categories',
  seasonal_picks: 'seasonal_categories',
  hero_carousel: 'banners',
  banner_strip: 'banners',
  flash_sale: 'best_sellers',
  deal_of_day: 'best_sellers',
};

// product_rail can read from either, so the admin picks.
const RAIL_SOURCES = ['best_sellers', 'top_sellers'];

// A banner strip can show either a banner placement or an advertisement
// category. Both are picked by name in `config`, not by sequence, so these
// types take no Content selector.
const STRIP_SOURCES = ['banners', 'advertisements'];

const BANNER_PLACEMENTS = [
  { value: 'home_top', label: 'Home — hero carousel' },
  { value: 'home_middle', label: 'Home — mid-page strip' },
];

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Everyone',
  new: 'New users',
  returning: 'Returning users',
  has_cart: 'Users with items in cart',
};

const emptyDraft = (): HomeSectionInput => ({
  type: 'product_rail',
  title: '',
  is_active: true,
  audience: 'all',
  starts_at: null,
  ends_at: null,
  style: { background_color: '' },
  source: { collection_name: 'best_sellers', sequence: null },
});

/** Datetime-local inputs want `YYYY-MM-DDTHH:mm`, not an ISO string with a zone. */
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ----------------------------------------------------------------------

export default function Page() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [meta, setMeta] = useState<{
    section_types: string[];
    personalized_types: string[];
    audiences: string[];
    sources: Record<string, SourceOption[]>;
  }>({ section_types: [], personalized_types: [], audiences: [], sources: {} });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Preview state. The feed is store-scoped, so the preview needs a store to
  // ask about — a section can be limited to some stores and absent from others.
  const [stores, setStores] = useState<StoreCode[]>([]);
  const [previewStore, setPreviewStore] = useState('');
  const [feed, setFeed] = useState<FeedSection[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');

  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [draft, setDraft] = useState<HomeSectionInput>(emptyDraft());
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getHomeSections();
      if (response.success) {
        setSections(response.data);
        setMeta(response.meta);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load the home layout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    let cancelled = false;
    getStoreCodes()
      .then((response) => {
        if (cancelled) return;
        const list = response.data ?? [];
        setStores(list);
        // Default to the first store rather than "all": the feed for no store
        // is not what any shopper sees.
        setPreviewStore((current) => current || list[0]?.store_code || '');
      })
      .catch(() => {
        // A missing store list only costs the selector; the preview still works
        // against the tenant-wide feed.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPreview = useCallback(async (storeCode: string) => {
    try {
      setFeedLoading(true);
      setFeedError('');
      const response = await previewHomeFeed(storeCode);
      setFeed(response.success ? response.data : []);
    } catch (err: any) {
      setFeed([]);
      setFeedError(err.message || 'Could not load the preview');
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // `sections` changes after every save, reorder and toggle, so the preview
  // follows edits without a manual refresh.
  useEffect(() => {
    loadPreview(previewStore);
  }, [loadPreview, previewStore, sections]);

  const isPersonalized = (type?: string) => Boolean(type && meta.personalized_types.includes(type));

  // Switched-off sections are absent from the feed, so the preview drops them.
  // What the app would actually receive, keyed by section id. A layout row
  // absent from the feed is one whose source is empty or out of window — worth
  // showing differently from one that simply has no items yet.
  const feedById = new Map(feed.map((section) => [section.id, section]));

  const visibleSections = sections.filter((s) => s.is_active);
  const hiddenCount = sections.length - visibleSections.length;

  // Active rows the feed did not return: the source was deleted, deactivated,
  // or has nothing for this store. Silent in the app, so worth surfacing here.
  const emptySections = feed.length
    ? visibleSections
        .filter((s) => !isPersonalized(s.type) && !feedById.has(s._id))
        .map((s) => s.title || TYPE_LABELS[s.type] || s.type)
    : [];

  const sourceCollectionFor = (type?: string, current?: string) => {
    if (!type) return 'none';
    if (type === 'product_rail') {
      return current && RAIL_SOURCES.includes(current) ? current : 'best_sellers';
    }
    if (type === 'banner_strip') {
      return current && STRIP_SOURCES.includes(current) ? current : 'banners';
    }
    return SOURCE_BY_TYPE[type] ?? 'none';
  };

  const sourceOptionsFor = (collection: string): SourceOption[] => meta.sources[collection] ?? [];

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setDialogOpen(true);
  };

  const openEdit = (section: HomeSection) => {
    setEditing(section);
    setDraft({
      type: section.type,
      title: section.title,
      is_active: section.is_active,
      audience: section.audience,
      starts_at: section.starts_at,
      ends_at: section.ends_at,
      style: { background_color: section.style?.background_color ?? '' },
      source: {
        collection_name: section.source?.collection_name ?? 'none',
        sequence: section.source?.sequence ?? null,
      },
    });
    setDialogOpen(true);
  };

  const setType = (type: string) => {
    const collection = sourceCollectionFor(type);
    setDraft((prev) => ({
      ...prev,
      type,
      source: { collection_name: collection, sequence: null },
    }));
  };

  // A content section with no source would render as an empty heading.
  // Banner and advertisement sections are addressed by name in `config`, so
  // they have no numbered source to pick.
  const needsSource =
    !isPersonalized(draft.type) &&
    draft.type !== 'hero_carousel' &&
    draft.type !== 'banner_strip';
  const draftValid = Boolean(draft.type && (!needsSource || draft.source?.sequence != null));

  const handleSave = async () => {
    if (!draftValid) return;
    try {
      setBusy(true);
      setError('');
      if (editing) {
        await updateHomeSection(editing._id, draft);
        setToast('Section saved');
      } else {
        await createHomeSection(draft);
        setToast('Section added');
      }
      setDialogOpen(false);
      await fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to save section');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (section: HomeSection) => {
    try {
      setBusy(true);
      await deleteHomeSection(section._id);
      setToast('Section removed from the layout');
      await fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to remove section');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (section: HomeSection) => {
    try {
      setBusy(true);
      await updateHomeSection(section._id, { is_active: !section.is_active });
      await fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to update section');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSections(reordered); // optimistic

    try {
      setBusy(true);
      await reorderHomeSections(reordered.map((s) => s._id));
      // The optimistic reorder already fired a preview load against the
      // pre-save order; reload now the server has the new one.
      await loadPreview(previewStore);
    } catch (err: any) {
      setError(err.message || 'Failed to reorder');
      await fetchSections();
    } finally {
      setBusy(false);
    }
  };

  const handleAdopt = async () => {
    try {
      setBusy(true);
      setError('');
      const response = await adoptCurrentLayout();
      setToast(response.message || 'Layout adopted');
      await fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to adopt the current layout');
    } finally {
      setBusy(false);
    }
  };

  const describeSource = (section: HomeSection) => {
    if (isPersonalized(section.type)) return 'Filled on the device';
    if (section.type === 'hero_carousel') return 'Banners · home_top';
    const options = sourceOptionsFor(section.source?.collection_name ?? '');
    const match = options.find((o) => o.sequence === section.source?.sequence);
    return match
      ? `${match.title}`
      : `${section.source?.collection_name ?? 'none'} · #${section.source?.sequence ?? '?'}`;
  };

  const scheduleLabel = (section: HomeSection) => {
    if (!section.starts_at && !section.ends_at) return null;
    const from = section.starts_at ? new Date(section.starts_at).toLocaleString() : 'now';
    const to = section.ends_at ? new Date(section.ends_at).toLocaleString() : 'no end';
    return `${from} → ${to}`;
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  const renderPreview = () => (
    <Grid size={{ xs: 12, md: 5 }}>
      <Card sx={{ p: 3, position: 'sticky', top: 24 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          Preview
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          The real feed for this store, exactly as the app receives it.
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="Preview store"
            value={previewStore}
            onChange={(e) => setPreviewStore(e.target.value)}
          >
            {stores.length === 0 && <MenuItem value="">All stores</MenuItem>}
            {stores.map((store) => (
              <MenuItem key={store.store_code} value={store.store_code}>
                {store.store_name || store.store_code}
              </MenuItem>
            ))}
          </TextField>
          <Tooltip title="Reload the preview">
            <span>
              <IconButton disabled={feedLoading} onClick={() => loadPreview(previewStore)}>
                {feedLoading ? (
                  <CircularProgress size={18} />
                ) : (
                  <Iconify icon={'solar:refresh-bold' as any} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {feedError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {feedError} — showing shapes only.
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <PhonePreview bgcolor="#f6f7f9">
            {/* App header */}
            <Stack spacing={1} sx={{ px: 1.5, pt: 0.5, pb: 1, bgcolor: '#fff' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box
                  sx={{
                    width: 64,
                    height: 12,
                    borderRadius: 999,
                    bgcolor: 'rgba(0,0,0,0.14)',
                  }}
                />
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: 'rgba(0,0,0,0.1)',
                  }}
                />
              </Stack>
              <Box
                sx={{
                  height: 22,
                  borderRadius: 999,
                  bgcolor: 'rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                }}
              >
                <Typography sx={{ fontSize: 9, color: 'rgba(0,0,0,0.35)' }}>
                  Search for products
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {feed.length === 0 ? (
                <Stack spacing={1} sx={{ py: 6, px: 3, alignItems: 'center', textAlign: 'center' }}>
                  <Iconify
                    icon={'solar:eye-closed-bold-duotone' as any}
                    width={36}
                    sx={{ color: 'text.disabled' }}
                  />
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {feedLoading
                      ? 'Loading the feed…'
                      : 'Nothing to show — every section is switched off or has no content for this store.'}
                  </Typography>
                </Stack>
              ) : (
                feed.map((section) => (
                  <HomeSectionBlock
                    key={section.id}
                    label={TYPE_LABELS[section.type] || section.type}
                    section={section}
                    personalized={section.personalized}
                    items={section.items}
                    resolvedTitle={section.title}
                  />
                ))
              )}
            </Box>
          </PhonePreview>
        </Box>

        {emptySections.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {emptySections.length} section
            {emptySections.length > 1 ? 's have' : ' has'} no content for this store and will not
            appear: {emptySections.join(', ')}.
          </Alert>
        )}

        {hiddenCount > 0 && (
          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            {hiddenCount} switched-off section{hiddenCount > 1 ? 's are' : ' is'} not shown.
          </Typography>
        )}
      </Card>
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">Home Screen</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The order sections appear in the mobile app. Content is still edited under Dynamic
            Section — this decides what shows and where.
          </Typography>
        </Box>
        {sections.length > 0 && (
          <PermissionButton section="dynamicSection" action="create" fallback="disable">
            <Button
              variant="contained"
              disabled={busy}
              onClick={openCreate}
              startIcon={<Iconify icon={'mingcute:add-line' as any} />}
            >
              Add Section
            </Button>
          </PermissionButton>
        )}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {sections.length === 0 ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: 6, textAlign: 'center' }}>
              <Iconify
                icon={'solar:widget-4-bold-duotone' as any}
                width={64}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6">This project uses the built-in layout</Typography>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mb: 3, maxWidth: 520, mx: 'auto' }}
              >
                The app is showing its default arrangement. Adopt it to turn those sections into
                rows you can reorder, schedule and switch off. Nothing changes for shoppers until
                you edit something — and deleting every row hands control back to the app.
              </Typography>
              <PermissionButton section="dynamicSection" action="create" fallback="disable">
                <Button variant="contained" disabled={busy} onClick={handleAdopt}>
                  Adopt the current layout
                </Button>
              </PermissionButton>
            </Card>
          </Grid>
          {renderPreview()}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={1.5}>
              {sections.map((section, index) => (
                <Card key={section._id} sx={{ p: 2, opacity: section.is_active ? 1 : 0.55 }}>
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
                        disabled={busy || index === sections.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <Iconify icon={'eva:arrow-ios-downward-fill' as any} />
                      </IconButton>
                    </Stack>

                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: section.style?.background_color || 'background.neutral',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {index + 1}
                      </Typography>
                    </Box>

                    <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="subtitle1" noWrap>
                          {section.title || TYPE_LABELS[section.type] || section.type}
                        </Typography>
                        <Chip size="small" label={TYPE_LABELS[section.type] || section.type} />
                        {isPersonalized(section.type) && (
                          <Tooltip title="Built on the device, so the feed stays cacheable">
                            <Chip size="small" color="info" label="Personalised" />
                          </Tooltip>
                        )}
                        {section.audience !== 'all' && (
                          <Chip
                            size="small"
                            color="warning"
                            label={AUDIENCE_LABELS[section.audience]}
                          />
                        )}
                        {!section.is_active && <Chip size="small" label="Hidden" />}
                      </Stack>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {describeSource(section)}
                        {scheduleLabel(section) ? ` · ${scheduleLabel(section)}` : ''}
                      </Typography>
                    </Stack>

                    <Switch
                      checked={section.is_active}
                      disabled={busy}
                      onChange={() => handleToggle(section)}
                    />

                    <PermissionButton section="dynamicSection" action="edit" fallback="disable">
                      <IconButton disabled={busy} onClick={() => openEdit(section)}>
                        <Iconify icon={'solar:pen-bold' as any} />
                      </IconButton>
                    </PermissionButton>

                    <PermissionButton section="dynamicSection" action="delete" fallback="disable">
                      <IconButton
                        color="error"
                        disabled={busy}
                        onClick={() => handleDelete(section)}
                      >
                        <Iconify icon={'solar:trash-bin-trash-bold' as any} />
                      </IconButton>
                    </PermissionButton>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Grid>
          {renderPreview()}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit section' : 'Add section'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Section type"
              value={draft.type ?? ''}
              onChange={(e) => setType(e.target.value)}
            >
              {meta.section_types.map((type) => (
                <MenuItem key={type} value={type}>
                  {TYPE_LABELS[type] || type}
                </MenuItem>
              ))}
            </TextField>

            {draft.type === 'product_rail' && (
              <TextField
                select
                fullWidth
                size="small"
                label="Products from"
                value={draft.source?.collection_name ?? 'best_sellers'}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    source: { collection_name: e.target.value, sequence: null },
                  }))
                }
              >
                <MenuItem value="best_sellers">Best sellers</MenuItem>
                <MenuItem value="top_sellers">Top sellers</MenuItem>
              </TextField>
            )}

            {draft.type === 'banner_strip' && (
              <>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Content from"
                  value={draft.source?.collection_name ?? 'banners'}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      source: { collection_name: e.target.value, sequence: null },
                      // The two sources are keyed differently, so a leftover
                      // key from the other one would silently match nothing.
                      config: {},
                    }))
                  }
                >
                  <MenuItem value="banners">Banners</MenuItem>
                  <MenuItem value="advertisements">Advertisements</MenuItem>
                </TextField>

                {(draft.source?.collection_name ?? 'banners') === 'banners' ? (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Placement"
                    helperText="Which banner placement this slot shows"
                    value={(draft.config?.section_name as string) ?? 'home_middle'}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        config: { ...prev.config, section_name: e.target.value },
                      }))
                    }
                  >
                    {BANNER_PLACEMENTS.map((placement) => (
                      <MenuItem key={placement.value} value={placement.value}>
                        {placement.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="Advertisement category"
                    placeholder="Leave empty for all except popups"
                    helperText="Matches the category set on the advertisement"
                    value={(draft.config?.category as string) ?? ''}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        config: { ...prev.config, category: e.target.value },
                      }))
                    }
                  />
                )}
              </>
            )}

            {needsSource && (
              <TextField
                select
                fullWidth
                size="small"
                label="Content"
                helperText="Which configured section this slot shows"
                value={draft.source?.sequence ?? ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    source: {
                      collection_name: sourceCollectionFor(prev.type, prev.source?.collection_name),
                      sequence: e.target.value === '' ? null : Number(e.target.value),
                    },
                  }))
                }
              >
                {sourceOptionsFor(
                  sourceCollectionFor(draft.type, draft.source?.collection_name)
                ).map((option) => (
                  <MenuItem key={option.sequence} value={option.sequence ?? ''}>
                    {option.title}
                    {option.is_active ? '' : ' (inactive)'}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              fullWidth
              size="small"
              label="Title override"
              placeholder="Leave empty to use the content's own title"
              value={draft.title ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            />

            <ColorField
              label="Background"
              hint="Section background — empty uses the app default"
              value={draft.style?.background_color ?? ''}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, style: { background_color: value } }))
              }
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Starts"
                  InputLabelProps={{ shrink: true }}
                  value={toLocalInput(draft.starts_at)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="datetime-local"
                  label="Ends"
                  InputLabelProps={{ shrink: true }}
                  value={toLocalInput(draft.ends_at)}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </Grid>
            </Grid>

            <TextField
              select
              fullWidth
              size="small"
              label="Audience"
              helperText="Non-default audiences are matched on the device"
              value={draft.audience ?? 'all'}
              onChange={(e) => setDraft((prev) => ({ ...prev, audience: e.target.value }))}
            >
              {meta.audiences.map((audience) => (
                <MenuItem key={audience} value={audience}>
                  {AUDIENCE_LABELS[audience] || audience}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={1} alignItems="center">
              <Switch
                checked={draft.is_active !== false}
                onChange={(e) => setDraft((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <Typography variant="body2">Show this section in the app</Typography>
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
