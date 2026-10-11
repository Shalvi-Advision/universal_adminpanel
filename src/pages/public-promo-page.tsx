import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { PROMO_BULLET_ICON_META } from 'src/utils/promo-bullet-icons';

import { type PromoBulletIcon } from 'src/services/promo-page';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5008';

type PromoPageData = {
  project: { project_code: string; app_name: string; logo_url: string };
  promo: {
    top_tags: string[];
    headline: string;
    subheadline: string;
    hero_image_url: string;
    background_color: string;
    headline_color: string;
    button_color: string;
    highlights_bg_color: string;
    highlights_title_color: string;
    highlights_subtitle_color: string;
    picks_bg_color: string;
    category_bg_color: string;
    card_bg_color: string;
    bullets: { icon: PromoBulletIcon; title: string; subtitle: string }[];
    android_url: string;
    ios_url: string;
  };
  categories: { name: string; image: string }[];
  products: { p_code: string; product_name: string; image: string; price: number | null; mrp: number | null }[];
};

// Picks whichever store link matches the visiting device, falling back to
// whichever one is actually set. Used for the single primary CTA button —
// the two store badges below it always link to their own specific store.
function smartDownloadUrl(androidUrl: string, iosUrl: string): string {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) return iosUrl || androidUrl;
  return androidUrl || iosUrl;
}

// Public, unauthenticated page — deliberately a plain fetch rather than
// apiClient, which attaches a bearer token / X-Project-Code from the signed-
// in session and force-redirects to /sign-in on 401. Neither applies here;
// the project code comes from the URL, and anyone can view this page.
export default function PublicPromoPage() {
  const { projectCode } = useParams<{ projectCode: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PromoPageData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/public/promo-page/${projectCode}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setNotFound(true);
        } else {
          setData(json.data);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (projectCode) {
      load();
    } else {
      setNotFound(true);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [projectCode]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !data) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}
      >
        <Typography variant="h4">Page not found</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This link isn&apos;t available right now.
        </Typography>
      </Box>
    );
  }

  const { project, promo, categories, products } = data;
  const primaryUrl = smartDownloadUrl(promo.android_url, promo.ios_url);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Full-width banner — first thing on the page */}
      {promo.hero_image_url && (
        <Box
          component="img"
          src={promo.hero_image_url}
          alt={promo.headline || project.app_name}
          sx={{ width: '100%', display: 'block' }}
        />
      )}

      {/* Headline + CTA + store badges */}
      <Box sx={{ bgcolor: promo.background_color || 'background.default' }}>
        <Container maxWidth="sm" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Stack spacing={2.5} alignItems="center">
            {promo.top_tags.length > 0 && (
              <Stack spacing={0.25}>
                {promo.top_tags.map((tag, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Typography
                    key={index}
                    variant="subtitle2"
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
                    {tag}
                  </Typography>
                ))}
              </Stack>
            )}

            <Typography
              variant="h3"
              sx={{ fontWeight: 800, color: promo.headline_color || 'primary.main', lineHeight: 1.2 }}
            >
              {promo.headline || project.app_name}
            </Typography>

            {promo.subheadline && (
              <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                {promo.subheadline}
              </Typography>
            )}

            {primaryUrl && (
              <Button
                size="large"
                variant="contained"
                component="a"
                href={primaryUrl}
                target="_blank"
                rel="noopener"
                endIcon={<Iconify icon={'solar:arrow-right-bold' as any} />}
                sx={{
                  borderRadius: 999,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  ...(promo.button_color && {
                    bgcolor: promo.button_color,
                    '&:hover': { bgcolor: promo.button_color, filter: 'brightness(0.92)' }
                  })
                }}
              >
                Download the App Now
              </Button>
            )}

            {(promo.android_url || promo.ios_url) && (
              <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                {promo.android_url && (
                  <Button
                    variant="contained"
                    color="inherit"
                    component="a"
                    href={promo.android_url}
                    target="_blank"
                    rel="noopener"
                    startIcon={<Iconify icon={'logos:google-play-icon' as any} />}
                    sx={{ bgcolor: 'common.black', color: 'common.white', '&:hover': { bgcolor: 'grey.900' } }}
                  >
                    Get it on Google Play
                  </Button>
                )}
                {promo.ios_url && (
                  <Button
                    variant="contained"
                    color="inherit"
                    component="a"
                    href={promo.ios_url}
                    target="_blank"
                    rel="noopener"
                    startIcon={<Iconify icon={'logos:apple' as any} />}
                    sx={{ bgcolor: 'common.black', color: 'common.white', '&:hover': { bgcolor: 'grey.900' } }}
                  >
                    Download on the App Store
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>

      {/* Highlights */}
      {promo.bullets.length > 0 && (
        <Box sx={{ bgcolor: promo.highlights_bg_color || 'background.default' }}>
          <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
            <Grid container spacing={3}>
              {promo.bullets.map((bullet, index) => {
                const meta = PROMO_BULLET_ICON_META[bullet.icon] ?? PROMO_BULLET_ICON_META.star;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                        <Iconify icon={meta.iconify as any} width={22} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 700, color: promo.highlights_title_color || 'text.primary' }}
                        >
                          {bullet.title}
                        </Typography>
                        {bullet.subtitle && (
                          <Typography
                            variant="body2"
                            sx={{ color: promo.highlights_subtitle_color || 'text.secondary' }}
                          >
                            {bullet.subtitle}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Today's Special Picks — active bestsellers */}
      {products.length > 0 && (
        <Box sx={{ bgcolor: promo.picks_bg_color || 'background.default' }}>
          <Container maxWidth="md" sx={{ py: { xs: 4, md: 5 } }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Today&apos;s Special Picks
            </Typography>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid key={product.p_code} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card sx={{ p: 1.5, textAlign: 'center', ...(promo.card_bg_color && { bgcolor: promo.card_bg_color }) }}>
                    <Avatar
                      src={product.image || undefined}
                      variant="rounded"
                      sx={{ width: '100%', height: 100, mx: 'auto', mb: 1 }}
                    >
                      <Iconify icon={'solar:box-bold-duotone' as any} width={32} />
                    </Avatar>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                      {product.product_name}
                    </Typography>
                    {product.price != null && (
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        ₹{product.price}
                      </Typography>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Shop by Category — active seasonal categories */}
      {categories.length > 0 && (
        <Box sx={{ bgcolor: promo.category_bg_color || 'background.neutral', py: { xs: 4, md: 5 } }}>
          <Container maxWidth="md">
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Shop by Category
            </Typography>
            <Grid container spacing={2}>
              {categories.map((cat) => (
                <Grid key={cat.name} size={{ xs: 6, sm: 4, md: 3 }}>
                  <Card sx={{ p: 1.5, textAlign: 'center', ...(promo.card_bg_color && { bgcolor: promo.card_bg_color }) }}>
                    <Avatar
                      src={cat.image || undefined}
                      variant="rounded"
                      sx={{ width: '100%', height: 100, mx: 'auto', mb: 1 }}
                    >
                      {cat.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {cat.name}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}
    </Box>
  );
}
