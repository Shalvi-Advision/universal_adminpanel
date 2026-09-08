import type { ChangeEvent } from 'react';
import type { ImageSuggestionStats } from 'src/services/image-cdn';
import type { WebSearchJob, ImageSuggestion, ImageCdnSettings } from 'src/types/api';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { ApiError } from 'src/utils/api-client';

import {
  getWebSearchJob,
  setGeminiApiKey,
  listWebSearchJobs,
  startWebSearchJob,
  getImageCdnSettings,
  getImageSuggestions,
  setGoogleCseSettings,
  acceptImageSuggestion,
  rejectImageSuggestion,
  getImageSuggestionStats,
  getImageSuggestionPreviewUrl,
  generateCrossTenantSuggestions,
} from 'src/services/image-cdn';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PAGE_SIZE = 10;

// Client-side mirror of the backend's config/geminiPricing.js default —
// used ONLY to pre-fill the budget field and show a pre-run estimate. The
// real guardrail is enforced server-side against its own (possibly
// env-overridden) value; if the two drift apart the worst case is a
// slightly-off estimate here, never an unenforced cap.
const ESTIMATED_COST_PER_ATTEMPT_INR = 32;
// Mirrors config/geminiPricing.js's GOOGLE_CSE_COST_INR default — used
// instead of the Gemini rate above once Google Custom Search is configured
// (see generateWebSearchSuggestions's own preference order on the backend).
const ESTIMATED_COST_PER_ATTEMPT_CSE_INR = 1;

// Remembers whether the admin left the review list open or collapsed —
// with 90+ pending suggestions being normal, re-opening the page shouldn't
// force scrolling past a wall of cards every time.
const EXPANDED_STORAGE_KEY = 'imageCdn.suggestions.listExpanded';

function readStoredExpanded(): boolean {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

// The preview endpoint requires auth, so it can't be a plain <img src>.
// Fetches once as a blob and revokes the object URL on unmount.
function SuggestionThumbnail({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    getImageSuggestionPreviewUrl(id)
      .then((u) => {
        if (!active) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  return (
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: 1.5,
        overflow: 'hidden',
        bgcolor: 'background.neutral',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {url ? (
        <Box component="img" src={url} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <CircularProgress size={16} />
      )}
    </Box>
  );
}

function VerdictChip({ label, verdict }: { label: string; verdict: 'MATCH' | 'NO_MATCH' | null }) {
  if (!verdict) return null;
  return (
    <Chip
      size="small"
      label={`${label}: ${verdict}`}
      color={verdict === 'MATCH' ? 'success' : 'error'}
      variant="outlined"
    />
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ textAlign: 'center', px: 1.5 }}>
      <Typography variant="h6" sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  );
}

// Every suggestion here — from either source — sits behind this one Accept
// / Reject gate. See the "Image Match Suggestions" architecture plan.
//
// selectedPCodes: products the admin ticked in the Missing Images table.
// When non-empty, "Find & download from web" searches exactly those and
// takes priority over the "how many" auto-pick field. onSelectionUsed is
// called after a successful selection-based search so the parent can clear
// the checkboxes.
export function SuggestedMatchesSection({
  selectedPCodes,
  onSelectionUsed,
}: {
  selectedPCodes: string[];
  onSelectionUsed: () => void;
}) {
  const [settings, setSettings] = useState<ImageCdnSettings | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  const [cseKeyInput, setCseKeyInput] = useState('');
  const [cseIdInput, setCseIdInput] = useState('');
  const [savingCse, setSavingCse] = useState(false);
  const [cseMessage, setCseMessage] = useState('');

  const [stats, setStats] = useState<ImageSuggestionStats | null>(null);
  const [generating, setGenerating] = useState(false);
  const [activeJob, setActiveJob] = useState<WebSearchJob | null>(null);
  const jobPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [webSearchLimit, setWebSearchLimit] = useState(50);
  // Pre-fills to a worst-case estimate (see ESTIMATED_COST_PER_ATTEMPT_INR)
  // so the guardrail is opt-out, not opt-in — tracks the limit/selection
  // size until the admin edits it by hand, then stays put.
  const [budgetInr, setBudgetInr] = useState<number | ''>(webSearchLimit * ESTIMATED_COST_PER_ATTEMPT_INR);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<ImageSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [listExpanded, setListExpanded] = useState(readStoredExpanded);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const toggleListExpanded = () => {
    setListExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXPANDED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Non-fatal — just falls back to defaulting open next visit.
      }
      return next;
    });
  };

  const loadSettings = useCallback(async () => {
    try {
      const res = await getImageCdnSettings();
      setSettings(res.data);
    } catch {
      // Non-fatal — the rest of the page still works, web search just
      // stays disabled until this resolves.
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await getImageSuggestionStats();
      setStats(res.data);
    } catch {
      // Non-fatal — the KPI row just stays hidden.
    }
  }, []);

  // Fetches one page of the review queue. If accepting/rejecting emptied
  // out the last item on a page beyond the first, steps back a page rather
  // than leaving the admin staring at an empty list with pages still above
  // it in the pager.
  const loadSuggestions = useCallback(async (targetPage = 1) => {
    try {
      setLoadingSuggestions(true);
      const res = await getImageSuggestions('pending', targetPage, PAGE_SIZE);
      if (res.data.length === 0 && targetPage > 1) {
        await loadSuggestions(targetPage - 1);
        return;
      }
      setSuggestions(res.data);
      setPage(res.page);
      setTotalPages(res.pages);
      setTotalCount(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  // One line describing a finished job's full breakdown — surfaces exactly
  // why "searched N of M selected" can be less than M (already had a
  // suggestion, no longer missing, or genuinely errored), which used to be
  // invisible and read as a bug.
  const summarizeJob = (job: WebSearchJob) => {
    const parts = [`Found ${job.found} of ${job.processed} searched (~₹${job.estimated_cost_inr} spent)`];
    const freeFinds = job.results?.filter((r) => r.found_via === 'open_food_facts').length ?? 0;
    if (freeFinds > 0) parts.push(`${freeFinds} of those free (Open Food Facts)`);
    if (job.already_tried > 0) parts.push(`${job.already_tried} already had a suggestion`);
    if (job.not_missing > 0) parts.push(`${job.not_missing} no longer missing`);
    if (job.budget_stopped > 0) parts.push(`${job.budget_stopped} skipped — budget cap reached`);
    if (job.errored > 0) parts.push(`${job.errored} errored`);
    return parts.join(' — ');
  };

  const stopPolling = () => {
    if (jobPollRef.current) {
      clearInterval(jobPollRef.current);
      jobPollRef.current = null;
    }
  };

  // Polls a running job every few seconds instead of holding the original
  // request open — see the backend route's own comment on why ("Find &
  // download" for even 10 products can take well past a minute). The admin
  // is free to navigate away, accept/reject other suggestions, or close the
  // tab entirely; re-opening the page picks the same job back up (see the
  // mount effect below) since it's tracked server-side, not in this
  // component's state.
  const pollJob = useCallback(
    async (jobId: string) => {
      stopPolling();
      const tick = async () => {
        try {
          const res = await getWebSearchJob(jobId);
          setActiveJob(res.data);
          if (res.data.status !== 'running') {
            stopPolling();
            await Promise.all([loadSuggestions(1), loadStats()]);
            if (res.data.status === 'completed') {
              setMessage(summarizeJob(res.data));
            } else {
              setError(`Search job failed: ${res.data.error_message || 'unknown error'}`);
            }
          }
        } catch {
          // A single flaky poll isn't worth tearing down the whole thing —
          // just try again on the next tick.
        }
      };
      await tick();
      jobPollRef.current = setInterval(tick, 4000);
    },
    [loadSuggestions, loadStats]
  );

  useEffect(() => {
    loadSettings();
    loadStats();
    loadSuggestions(1);

    // Resumes tracking a job that was already running when this page (or
    // browser tab) was opened — the search keeps going server-side
    // regardless of whether anyone's watching it.
    (async () => {
      try {
        const res = await listWebSearchJobs(1);
        const latest = res.data[0];
        if (latest?.status === 'running') {
          setActiveJob(latest);
          pollJob(latest._id);
        }
      } catch {
        // Non-fatal — the admin can still start a fresh search.
      }
    })();

    return stopPolling;
  }, [loadSettings, loadStats, loadSuggestions, pollJob]);

  // Keeps the pre-filled budget tracking "how many" (or the selection
  // size) and whichever per-attempt rate currently applies, until the
  // admin edits the budget field by hand — after that it's theirs to
  // manage, this stops overwriting it.
  useEffect(() => {
    if (budgetTouched) return;
    const attempts = selectedPCodes.length > 0 ? selectedPCodes.length : webSearchLimit;
    const perAttempt = settings?.google_cse_configured ? ESTIMATED_COST_PER_ATTEMPT_CSE_INR : ESTIMATED_COST_PER_ATTEMPT_INR;
    setBudgetInr(attempts * perAttempt);
  }, [webSearchLimit, selectedPCodes.length, budgetTouched, settings?.google_cse_configured]);

  const handlePageChange = (_event: ChangeEvent<unknown>, value: number) => {
    loadSuggestions(value);
  };

  const handleSaveKey = async () => {
    try {
      setSavingKey(true);
      setKeyMessage('');
      await setGeminiApiKey(geminiKeyInput);
      setGeminiKeyInput('');
      setKeyMessage('Saved.');
      await loadSettings();
    } catch (err: any) {
      setKeyMessage(err.message || 'Failed to save key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleSaveCse = async () => {
    try {
      setSavingCse(true);
      setCseMessage('');
      await setGoogleCseSettings(cseKeyInput, cseIdInput);
      setCseKeyInput('');
      setCseIdInput('');
      setCseMessage('Saved.');
      await loadSettings();
    } catch (err: any) {
      setCseMessage(err.message || 'Failed to save');
    } finally {
      setSavingCse(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setMessage('');
      const res = await generateCrossTenantSuggestions();
      setMessage(res.message);
      await Promise.all([loadSuggestions(1), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleWebSearch = async () => {
    try {
      setError('');
      setMessage('');
      const usingSelection = selectedPCodes.length > 0;
      const budget = typeof budgetInr === 'number' && budgetInr > 0 ? budgetInr : undefined;
      const res = await startWebSearchJob({
        ...(usingSelection ? { pCodes: selectedPCodes } : { limit: webSearchLimit }),
        budgetInr: budget,
      });
      // The selection's job is done once it's queued — the checkboxes
      // don't need to stay ticked while the search itself runs in the
      // background.
      if (usingSelection) onSelectionUsed();
      await pollJob(res.data.job_id);
    } catch (err: any) {
      // Someone (this admin in another tab, or a teammate) already has a
      // job running for this tenant — track that one instead of erroring
      // out, since starting a second would just be rejected again.
      if (err instanceof ApiError && err.status === 409 && err.data?.data?.job_id) {
        setMessage('A search job was already running for this tenant — now tracking it.');
        await pollJob(err.data.data.job_id);
        return;
      }
      setError(err.message || 'Failed to start web search');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      setActioningId(id);
      setError('');
      await acceptImageSuggestion(id);
      // Re-fetches this page rather than just filtering the item out
      // locally, so the next item from later pages slides up to fill the
      // gap instead of leaving the page one short.
      await Promise.all([loadSuggestions(page), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Accept failed');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActioningId(id);
      setError('');
      await rejectImageSuggestion(id);
      await Promise.all([loadSuggestions(page), loadStats()]);
    } catch (err: any) {
      setError(err.message || 'Reject failed');
    } finally {
      setActioningId(null);
    }
  };

  const hasSelection = selectedPCodes.length > 0;
  const jobRunning = activeJob?.status === 'running';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h6">Suggested matches</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Finds candidate photos for missing products two ways: matching against images already in our
              barcode pool (free), or a live web search (real cost) — pick products in the Missing Images
              table below and search just those, or auto-pick a batch. Accepting a match saves it into the
              pool under its own barcode too, not just this product — so it&apos;s findable directly next
              time, for this tenant or any other. Every suggestion lands here for review first — nothing is
              ever applied automatically.
            </Typography>
          </Box>
          {stats && (
            <Stack direction="row" divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />}>
              <StatChip label="Pending review" value={stats.pending} />
              <StatChip label="Accepted" value={stats.accepted} />
              <StatChip label="Rejected" value={stats.rejected} />
            </Stack>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            type="password"
            label="Gemini API key"
            placeholder={settings?.gemini_configured ? 'Configured — paste a new one to replace it' : 'Not set'}
            value={geminiKeyInput}
            onChange={(e) => setGeminiKeyInput(e.target.value)}
            sx={{ minWidth: 320 }}
          />
          <Button size="small" variant="outlined" onClick={handleSaveKey} disabled={savingKey || !geminiKeyInput}>
            {savingKey ? 'Saving…' : 'Save key'}
          </Button>
          {settings && (
            <Chip
              size="small"
              icon={<Iconify icon={(settings.gemini_configured ? 'eva:checkmark-fill' : 'mingcute:close-line') as any} />}
              label={settings.gemini_configured ? 'Gemini configured' : 'Gemini not configured'}
              color={settings.gemini_configured ? 'success' : 'default'}
              variant="outlined"
            />
          )}
          {keyMessage && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {keyMessage}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            type="password"
            label="Google Custom Search API key"
            placeholder={settings?.google_cse_configured ? 'Configured' : 'Not set'}
            value={cseKeyInput}
            onChange={(e) => setCseKeyInput(e.target.value)}
            sx={{ minWidth: 260 }}
          />
          <TextField
            size="small"
            label="Search Engine ID (cx)"
            placeholder={settings?.google_cse_configured ? 'Configured' : 'Not set'}
            value={cseIdInput}
            onChange={(e) => setCseIdInput(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={handleSaveCse}
            disabled={savingCse || !cseKeyInput.trim() || !cseIdInput.trim()}
          >
            {savingCse ? 'Saving…' : 'Save'}
          </Button>
          {settings && (
            <Chip
              size="small"
              icon={
                <Iconify icon={(settings.google_cse_configured ? 'eva:checkmark-fill' : 'mingcute:close-line') as any} />
              }
              label={settings.google_cse_configured ? 'Google Search configured (cheaper)' : 'Optional — cheaper than Gemini search'}
              color={settings.google_cse_configured ? 'success' : 'default'}
              variant="outlined"
            />
          )}
          {cseMessage && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {cseMessage}
            </Typography>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
          Optional, ~30x cheaper than Gemini web search — used automatically instead of it once both fields are
          set. Create a search engine at{' '}
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            programmablesearchengine.google.com
          </Box>{' '}
          (set it to search the whole web, turn on Image search), then enable the &quot;Custom Search API&quot;
          for an API key at{' '}
          <Box component="span" sx={{ fontFamily: 'monospace' }}>
            console.cloud.google.com
          </Box>
          . Free for the first 100 searches/day, then billed on that Cloud project.
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : <Iconify icon="solar:restart-bold" />}
          >
            {generating ? 'Generating…' : 'Generate suggestions from image pool'}
          </Button>

          {!hasSelection && (
            <TextField
              size="small"
              type="number"
              label="How many"
              value={webSearchLimit}
              onChange={(e) => setWebSearchLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
              sx={{ width: 110 }}
              slotProps={{ htmlInput: { min: 1, max: 1000 } }}
            />
          )}
          <TextField
            size="small"
            type="number"
            label="Budget cap (₹)"
            value={budgetInr}
            onChange={(e) => {
              setBudgetTouched(true);
              const v = e.target.value;
              setBudgetInr(v === '' ? '' : Math.max(0, parseFloat(v) || 0));
            }}
            sx={{ width: 140 }}
            helperText="0 = no cap"
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <Button
            variant="outlined"
            onClick={handleWebSearch}
            disabled={jobRunning || !settings?.gemini_configured}
            startIcon={jobRunning ? <CircularProgress size={16} /> : <Iconify icon="eva:search-fill" />}
          >
            {jobRunning
              ? 'Searching…'
              : hasSelection
                ? `Find & download for ${selectedPCodes.length} selected`
                : `Find & download from web (${webSearchLimit})`}
          </Button>
          {hasSelection && (
            <Button size="small" onClick={onSelectionUsed} disabled={jobRunning}>
              Clear selection
            </Button>
          )}
        </Stack>

        {!jobRunning && settings?.gemini_configured && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            Every product with a barcode is checked against Open Food Facts first, free. Worst-case estimate for
            whatever&apos;s left: up to ₹
            {(hasSelection ? selectedPCodes.length : webSearchLimit) *
              (settings.google_cse_configured ? ESTIMATED_COST_PER_ATTEMPT_CSE_INR : ESTIMATED_COST_PER_ATTEMPT_INR)}{' '}
            for {hasSelection ? selectedPCodes.length : webSearchLimit} attempt(s) via{' '}
            {settings.google_cse_configured ? 'Google Custom Search' : 'Gemini web search'} — every paid attempt
            costs the same whether or not it finds an image. The budget cap above stops the job early once
            it&apos;s reached.
          </Typography>
        )}

        {activeJob && jobRunning && (
          <Box sx={{ px: 0.5 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Searching the web — {activeJob.processed} of {activeJob.batch_total || activeJob.requested} processed,{' '}
                {activeJob.found} found, ~₹{activeJob.estimated_cost_inr} spent so far
                {activeJob.budget_inr ? ` of ₹${activeJob.budget_inr} budget` : ''}. Feel free to keep working —
                this keeps running in the background and picks back up here if you leave and come back.
              </Typography>
            </Stack>
            <LinearProgress
              variant={activeJob.batch_total > 0 ? 'determinate' : 'indeterminate'}
              value={activeJob.batch_total > 0 ? (activeJob.processed / activeJob.batch_total) * 100 : undefined}
            />
          </Box>
        )}

        {!settings?.gemini_configured && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            Set a Gemini API key above to enable web search — it has a real cost per request, billed to
            that key.
          </Typography>
        )}
        {hasSelection && settings?.gemini_configured && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            Tick products in the Missing Images table below to search specific ones instead of an
            auto-picked batch — untick all to go back to the batch mode.
          </Typography>
        )}

        <Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            onClick={toggleListExpanded}
            sx={{ cursor: 'pointer', userSelect: 'none', py: 0.5 }}
          >
            <IconButton size="small" tabIndex={-1}>
              <Iconify icon={listExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-forward-fill'} />
            </IconButton>
            <Typography variant="subtitle2">
              Review queue{totalCount > 0 ? ` (${totalCount} pending)` : ''}
            </Typography>
          </Stack>

          <Collapse in={listExpanded}>
            {loadingSuggestions ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : suggestions.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                No pending suggestions — generate some above.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                {suggestions.map((s) => (
                  <Stack
                    key={s._id}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                  >
                    <SuggestionThumbnail id={s._id} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap>
                        {s.product_name}{' '}
                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                          ({s.p_code})
                        </Typography>
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5, rowGap: 0.5 }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={s.source === 'cross_tenant' ? `From ${s.suggested_from_project}` : 'Web search'}
                        />
                        {s.source === 'cross_tenant' && s.suggested_from_name && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
                            &quot;{s.suggested_from_name}&quot;
                          </Typography>
                        )}
                        {typeof s.text_score === 'number' && (
                          <Chip size="small" variant="outlined" label={`score ${s.text_score}`} />
                        )}
                        <VerdictChip label="Gemini" verdict={s.vision_gemini?.verdict ?? null} />
                        <VerdictChip label="DeepSeek" verdict={s.vision_deepseek?.verdict ?? null} />
                      </Stack>
                      {s.vision_gemini?.reason && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}
                        >
                          {s.vision_gemini.reason}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        color="success"
                        size="small"
                        disabled={actioningId === s._id}
                        onClick={() => handleAccept(s._id)}
                      >
                        <Iconify icon="eva:checkmark-fill" />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        disabled={actioningId === s._id}
                        onClick={() => handleReject(s._id)}
                      >
                        <Iconify icon="mingcute:close-line" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}

            {!loadingSuggestions && totalPages > 1 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Page {page} of {totalPages} — {totalCount} pending total
                </Typography>
                <Pagination page={page} count={totalPages} onChange={handlePageChange} size="small" color="primary" />
              </Stack>
            )}
          </Collapse>
        </Box>
      </Stack>
    </Card>
  );
}
