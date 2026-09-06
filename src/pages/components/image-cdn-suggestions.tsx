import type { ImageSuggestion, ImageCdnSettings } from 'src/types/api';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import {
  setGeminiApiKey,
  getImageCdnSettings,
  getImageSuggestions,
  acceptImageSuggestion,
  rejectImageSuggestion,
  generateWebSearchSuggestions,
  getImageSuggestionPreviewUrl,
  generateCrossTenantSuggestions,
} from 'src/services/image-cdn';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

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

// Every suggestion here — from either source — sits behind this one Accept
// / Reject gate. See the "Image Match Suggestions" architecture plan.
export function SuggestedMatchesSection() {
  const [settings, setSettings] = useState<ImageCdnSettings | null>(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState('');

  const [generating, setGenerating] = useState(false);
  const [webSearching, setWebSearching] = useState(false);
  const [webSearchLimit, setWebSearchLimit] = useState(50);
  const [suggestions, setSuggestions] = useState<ImageSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await getImageCdnSettings();
      setSettings(res.data);
    } catch {
      // Non-fatal — the rest of the page still works, web search just
      // stays disabled until this resolves.
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      const res = await getImageSuggestions('pending');
      setSuggestions(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadSuggestions();
  }, [loadSettings, loadSuggestions]);

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

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setMessage('');
      const res = await generateCrossTenantSuggestions();
      setMessage(res.message);
      await loadSuggestions();
    } catch (err: any) {
      setError(err.message || 'Failed to generate suggestions');
    } finally {
      setGenerating(false);
    }
  };

  const handleWebSearch = async () => {
    try {
      setWebSearching(true);
      setError('');
      setMessage('');
      const res = await generateWebSearchSuggestions(webSearchLimit);
      setMessage(res.message);
      await loadSuggestions();
    } catch (err: any) {
      setError(err.message || 'Web search failed');
    } finally {
      setWebSearching(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      setActioningId(id);
      setError('');
      await acceptImageSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
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
      setSuggestions((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      setError(err.message || 'Reject failed');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h6">Suggested matches</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Finds candidate photos for missing products two ways: matching against images already in our
            barcode pool (free), or a live web search you control the size of (real cost). Accepting a
            match saves it into the pool under its own barcode too, not just this product — so it&apos;s
            findable directly next time, for this tenant or any other. Every suggestion lands here for
            review first — nothing is ever applied automatically.
          </Typography>
        </Box>

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

          <TextField
            size="small"
            type="number"
            label="How many"
            value={webSearchLimit}
            onChange={(e) => setWebSearchLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
            sx={{ width: 110 }}
            slotProps={{ htmlInput: { min: 1, max: 1000 } }}
          />
          <Button
            variant="outlined"
            onClick={handleWebSearch}
            disabled={webSearching || !settings?.gemini_configured}
            startIcon={webSearching ? <CircularProgress size={16} /> : <Iconify icon="eva:search-fill" />}
          >
            {webSearching ? 'Searching…' : `Find & download from web (${webSearchLimit})`}
          </Button>
        </Stack>
        {!settings?.gemini_configured && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
            Set a Gemini API key above to enable web search — it has a real cost per request, billed to
            that key.
          </Typography>
        )}

        <Box>
          {loadingSuggestions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : suggestions.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
              No pending suggestions — generate some above.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
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
        </Box>
      </Stack>
    </Card>
  );
}
