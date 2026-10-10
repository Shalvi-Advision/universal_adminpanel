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
    headline: string;
    subheadline: string;
    hero_image_url: string;
    bullets: { icon: PromoBulletIcon; title: string; subtitle: string }[];
    android_url: string;
    ios_url: string;
  };
  categories: { name: string; image: string }[];
  products: { p_code: string; product_name: string; image: string; price: number | null; mrp: number | null }[];
};

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero */}
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.vars.palette.primary.dark}, ${theme.vars.palette.primary.main})`,
          color: 'common.white',
          py: { xs: 6, md: 10 }
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            {project.logo_url && (
              <Avatar src={project.logo_url} alt={project.app_name} sx={{ width: 72, height: 72 }} />
            )}
            {promo.hero_image_url && (
              <Box
                component="img"
                src={promo.hero_image_url}
                alt={promo.headline || project.app_name}
                sx={{ maxWidth: '100%', maxHeight: 360, borderRadius: 2, boxShadow: 6 }}
              />
            )}
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {promo.headline || project.app_name}
            </Typography>
            {promo.subheadline && (
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                {promo.subheadline}
              </Typography>
            )}
            <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
              {promo.android_url && (
                <Button
                  size="large"
                  variant="contained"
                  color="inherit"
                  component="a"
                  href={promo.android_url}
                  target="_blank"
                  rel="noopener"
                  startIcon={<Iconify icon={'logos:google-play-icon' as any} />}
                  sx={{ color: 'primary.main' }}
                >
                  Get it on Google Play
                </Button>
              )}
              {promo.ios_url && (
                <Button
                  size="large"
                  variant="contained"
                  color="inherit"
                  component="a"
                  href={promo.ios_url}
                  target="_blank"
                  rel="noopener"
                  startIcon={<Iconify icon={'logos:apple' as any} />}
                  sx={{ color: 'primary.main' }}
                >
                  Download on the App Store
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Highlights */}
      {promo.bullets.length > 0 && (
        <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
          <Grid container spacing={3}>
            {promo.bullets.map((bullet, index) => {
              const meta = PROMO_BULLET_ICON_META[bullet.icon] ?? PROMO_BULLET_ICON_META.star;
              return (
                 
                <Grid key={index} size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                      <Iconify icon={meta.iconify as any} width={22} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {bullet.title}
                      </Typography>
                      {bullet.subtitle && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
      )}

      {/* Live storefront preview */}
      {(categories.length > 0 || products.length > 0) && (
        <Box sx={{ bgcolor: 'background.neutral', py: { xs: 5, md: 8 } }}>
          <Container maxWidth="md">
            {categories.length > 0 && (
              <Box sx={{ mb: 5 }}>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                  Popular Categories
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {categories.map((cat) => (
                    <Stack key={cat.name} spacing={1} alignItems="center" sx={{ width: 96 }}>
                      <Avatar src={cat.image || undefined} variant="rounded" sx={{ width: 64, height: 64 }}>
                        {cat.name.charAt(0)}
                      </Avatar>
                      <Typography variant="caption" textAlign="center" noWrap sx={{ maxWidth: 96 }}>
                        {cat.name}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {products.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                  Trending Products
                </Typography>
                <Grid container spacing={2}>
                  {products.map((product) => (
                    <Grid key={product.p_code} size={{ xs: 6, sm: 4, md: 2 }}>
                      <Card sx={{ p: 1.5, textAlign: 'center' }}>
                        <Avatar
                          src={product.image || undefined}
                          variant="rounded"
                          sx={{ width: '100%', height: 80, mx: 'auto', mb: 1 }}
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
              </Box>
            )}
          </Container>
        </Box>
      )}

      {/* Footer CTA */}
      <Box sx={{ py: { xs: 5, md: 7 }, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
          Click to Download
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          {promo.android_url && (
            <Button
              size="large"
              variant="outlined"
              component="a"
              href={promo.android_url}
              target="_blank"
              rel="noopener"
              startIcon={<Iconify icon={'logos:google-play-icon' as any} />}
            >
              Google Play
            </Button>
          )}
          {promo.ios_url && (
            <Button
              size="large"
              variant="outlined"
              component="a"
              href={promo.ios_url}
              target="_blank"
              rel="noopener"
              startIcon={<Iconify icon={'logos:apple' as any} />}
            >
              App Store
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
