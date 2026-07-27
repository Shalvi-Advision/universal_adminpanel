import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

// One home section as the app lays it out.
//
// When the caller supplies `items` — the same payload the app receives from
// /api/home/feed — the block renders the real images and labels, so the
// preview answers "what will shoppers see" rather than "roughly what shape".
// Without them it falls back to a grey wireframe, which is still the right
// answer for a personalised slot or a section whose source is empty.

const TINT = 'rgba(0,0,0,0.08)';
const TINT_STRONG = 'rgba(0,0,0,0.14)';

/**
 * Just enough of a section to draw it. Structural rather than tied to
 * HomeSection, so both a layout row and a feed section satisfy it — the
 * preview draws the feed, which is what the app actually receives.
 */
type PreviewableSection = {
  type: string;
  title?: string;
  style?: { background_color?: string };
};

type Props = {
  section: PreviewableSection;
  /** Personalised sections arrive empty and are filled on the device. */
  personalized: boolean;
  label: string;
  /** Live items from the feed; omit to draw the wireframe instead. */
  items?: Record<string, any>[];
  /** Title the feed resolved, which may come from the source document. */
  resolvedTitle?: string;
};

export function HomeSectionBlock({ section, personalized, label, items, resolvedTitle }: Props) {
  const background = section.style?.background_color || 'transparent';
  const heading = section.title || resolvedTitle || label;
  const live = !personalized && items && items.length > 0;

  return (
    <Box sx={{ px: 1.5, py: 1.25, bgcolor: background }}>
      {heading && <SectionHeading title={heading} />}
      {personalized ? (
        <PersonalizedBody label={label} />
      ) : live ? (
        <LiveBody type={section.type} items={items} />
      ) : (
        <SectionBody type={section.type} />
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------
// Live content

/** First usable image on a feed item, whatever shape the section uses. */
function imageOf(item: Record<string, any>): string {
  const assets = item?.banner_urls;
  if (assets && typeof assets === 'object') {
    for (const asset of Object.values<any>(assets)) {
      if (asset && typeof asset === 'object') {
        const url = asset.mobile || asset.desktop;
        if (url) return String(url);
      }
    }
  }
  return String(
    item?.image_link ||
      item?.image_url ||
      // An advertisement's own key.
      item?.banner_url ||
      item?.product_details?.pcode_img ||
      item?.product_details?.image_url ||
      ''
  );
}

/** Label for a tile: subcategory name, category name or product name. */
function labelOf(item: Record<string, any>): string {
  return String(
    item?.subcategory_details?.sub_category_name ||
      item?.category_details?.category_name ||
      item?.product_details?.product_name ||
      // A brand tile carries only its name.
      item?.brand_name ||
      item?.title ||
      ''
  );
}

function priceOf(item: Record<string, any>): string {
  const price = item?.product_details?.our_price;
  const numeric = Number(price);
  return Number.isFinite(numeric) && numeric > 0 ? `₹${Math.round(numeric)}` : '';
}

function Thumb({ src, height, radius = 1 }: { src: string; height: number; radius?: number }) {
  if (!src) {
    return <Box sx={{ height, borderRadius: radius, bgcolor: TINT_STRONG }} />;
  }
  return (
    <Box
      component="img"
      src={src}
      alt=""
      loading="lazy"
      sx={{
        width: 1,
        height,
        borderRadius: radius,
        objectFit: 'cover',
        bgcolor: TINT,
        display: 'block',
      }}
    />
  );
}

function TileLabel({ text }: { text: string }) {
  return (
    <Typography
      sx={{
        fontSize: 7.5,
        lineHeight: 1.25,
        textAlign: 'center',
        color: 'rgba(0,0,0,0.66)',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}
    >
      {text}
    </Typography>
  );
}

function LiveBody({ type, items }: { type: string; items: Record<string, any>[] }) {
  switch (type) {
    case 'coupon_strip':
      return (
        <Stack direction="row" spacing={0.75}>
          {items.slice(0, 2).map((item, i) => (
            <Box
              key={item.id ?? i}
              sx={{
                flex: 1,
                minWidth: 0,
                p: 0.75,
                borderRadius: 1,
                border: '1px solid rgba(0,0,0,0.18)',
              }}
            >
              <Typography sx={{ fontSize: 8, fontWeight: 700 }}>
                {item.discount_type === 'percentage'
                  ? `${Math.round(Number(item.discount_amount) || 0)}% off`
                  : `₹${Math.round(Number(item.discount_amount) || 0)} off`}
              </Typography>
              <TileLabel text={String(item.title ?? '')} />
            </Box>
          ))}
        </Stack>
      );

    // A banner placement or an advertisement category: one wide image, or
    // several that scroll.
    case 'banner_strip':
      return items.length === 1 ? (
        <Thumb src={imageOf(items[0])} height={54} radius={1.5} />
      ) : (
        <Stack direction="row" spacing={0.75}>
          {items.slice(0, 3).map((item, i) => (
            <Box key={item.id ?? i} sx={{ width: 78, flexShrink: 0 }}>
              <Thumb src={imageOf(item)} height={48} radius={1.5} />
            </Box>
          ))}
        </Stack>
      );

    case 'hero_carousel':
      return (
        <Box>
          <Thumb src={imageOf(items[0])} height={74} radius={1.5} />
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 0.75 }}>
            {items.slice(0, 4).map((item, i) => (
              <Box
                key={item.id ?? i}
                sx={{
                  width: i === 0 ? 12 : 4,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: i === 0 ? 'rgba(0,0,0,0.45)' : TINT_STRONG,
                }}
              />
            ))}
          </Stack>
        </Box>
      );

    case 'category_strip':
    case 'brand_strip':
      return (
        <Stack direction="row" spacing={1}>
          {items.slice(0, 5).map((item, i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Box
                component={imageOf(item) ? 'img' : 'div'}
                src={imageOf(item) || undefined}
                alt=""
                loading="lazy"
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  bgcolor: TINT_STRONG,
                }}
              />
              <TileLabel text={labelOf(item)} />
            </Stack>
          ))}
        </Stack>
      );

    case 'category_grid':
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
          {items.slice(0, 8).map((item, i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Thumb src={imageOf(item)} height={30} />
              <TileLabel text={labelOf(item)} />
            </Stack>
          ))}
        </Box>
      );

    case 'product_rail':
    case 'seasonal_picks':
    case 'flash_sale':
    case 'deal_of_day':
      return (
        <Stack direction="row" spacing={1}>
          {items.slice(0, 3).map((item, i) => (
            <Stack key={i} spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
              <Thumb src={imageOf(item)} height={52} />
              <TileLabel text={labelOf(item)} />
              {priceOf(item) && (
                <Typography sx={{ fontSize: 8, fontWeight: 700, color: 'rgba(0,0,0,0.75)' }}>
                  {priceOf(item)}
                </Typography>
              )}
            </Stack>
          ))}
        </Stack>
      );

    default:
      return <SectionBody type={type} />;
  }
}

// ----------------------------------------------------------------------

function SectionHeading({ title }: { title: string }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.82)' }} noWrap>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 9, color: 'rgba(0,0,0,0.4)' }}>See all</Typography>
    </Stack>
  );
}

/** The device fills these at runtime, so there is nothing to shape here. */
function PersonalizedBody({ label }: { label: string }) {
  return (
    <Box
      sx={{
        height: 46,
        borderRadius: 1.5,
        border: '1px dashed rgba(0,0,0,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: 9, color: 'rgba(0,0,0,0.42)' }}>
        {label} · filled on the device
      </Typography>
    </Box>
  );
}

function SectionBody({ type }: { type: string }) {
  switch (type) {
    case 'banner_strip':
      return (
        <Stack direction="row" spacing={0.75}>
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ width: 78, height: 48, borderRadius: 1.5, bgcolor: TINT_STRONG }} />
          ))}
        </Stack>
      );

    case 'hero_carousel':
      return (
        <Box>
          <Box sx={{ height: 74, borderRadius: 1.5, bgcolor: TINT_STRONG }} />
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 0.75 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: i === 0 ? 12 : 4,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: i === 0 ? 'rgba(0,0,0,0.45)' : TINT_STRONG,
                }}
              />
            ))}
          </Stack>
        </Box>
      );

    case 'category_strip':
    case 'brand_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '80%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    case 'category_grid':
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Stack key={i} spacing={0.5} alignItems="center">
              <Box sx={{ width: 1, height: 30, borderRadius: 1, bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '75%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Box>
      );

    case 'product_rail':
    case 'seasonal_picks':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2].map((i) => (
            <Stack key={i} spacing={0.5} sx={{ flex: 1 }}>
              <Box sx={{ height: 52, borderRadius: 1, bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '90%', height: 4, borderRadius: 999, bgcolor: TINT }} />
              <Box sx={{ width: '55%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    case 'deal_of_day':
      return (
        <Stack direction="row" spacing={1} sx={{ height: 62 }}>
          <Box sx={{ width: 62, borderRadius: 1, bgcolor: TINT_STRONG }} />
          <Stack spacing={0.75} sx={{ flex: 1, justifyContent: 'center' }}>
            <Box sx={{ width: '85%', height: 5, borderRadius: 999, bgcolor: TINT_STRONG }} />
            <Box sx={{ width: '60%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            <Box sx={{ width: 52, height: 12, borderRadius: 999, bgcolor: 'rgba(0,0,0,0.3)' }} />
          </Stack>
        </Stack>
      );

    case 'flash_sale':
      return (
        <Box sx={{ borderRadius: 1.5, bgcolor: TINT_STRONG, p: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 0.75 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{ width: 16, height: 14, borderRadius: 0.5, bgcolor: 'rgba(0,0,0,0.35)' }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{ flex: 1, height: 38, borderRadius: 1, bgcolor: 'rgba(0,0,0,0.1)' }}
              />
            ))}
          </Stack>
        </Box>
      );

    case 'coupon_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 34,
                borderRadius: 1,
                border: '1px dashed rgba(0,0,0,0.25)',
                bgcolor: TINT,
              }}
            />
          ))}
        </Stack>
      );

    case 'free_delivery_progress':
      return (
        <Stack spacing={0.75}>
          <Box sx={{ width: '70%', height: 5, borderRadius: 999, bgcolor: TINT }} />
          <Box sx={{ height: 6, borderRadius: 999, bgcolor: TINT, overflow: 'hidden' }}>
            <Box sx={{ width: '55%', height: 1, bgcolor: 'rgba(0,0,0,0.4)' }} />
          </Box>
        </Stack>
      );

    case 'usp_strip':
      return (
        <Stack direction="row" spacing={1}>
          {[0, 1, 2].map((i) => (
            <Stack key={i} spacing={0.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: TINT_STRONG }} />
              <Box sx={{ width: '85%', height: 4, borderRadius: 999, bgcolor: TINT }} />
            </Stack>
          ))}
        </Stack>
      );

    default:
      return <Box sx={{ height: 46, borderRadius: 1.5, bgcolor: TINT_STRONG }} />;
  }
}
