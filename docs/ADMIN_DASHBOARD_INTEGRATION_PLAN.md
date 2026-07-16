# Admin Dashboard Integration Plan

## Overview
Integrate real dashboard APIs into the admin panel dashboard page. Replace mock data with actual API calls to display real-time statistics, analytics, and insights.

## Dashboard APIs Available

### 1. Dashboard Overview
**Endpoint:** `GET /api/admin/dashboard/overview`

**Tested Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 11,
      "newToday": 1,
      "newThisMonth": 3,
      "newLastMonth": 8,
      "growth": -62.5
    },
    "products": {
      "total": 0,
      "active": 0,
      "outOfStock": 0,
      "lowStock": 0
    },
    "orders": {
      "total": 2,
      "today": 0,
      "thisWeek": 0,
      "thisMonth": 0,
      "lastMonth": 2,
      "pending": 2,
      "growth": -100
    },
    "revenue": {
      "total": 127,
      "today": 0,
      "thisMonth": 0,
      "lastMonth": 127,
      "averageOrderValue": 63.5,
      "growth": null
    }
  }
}
```

**Use Cases:**
- Display key metrics cards (Users, Products, Orders, Revenue)
- Show growth percentages with trend indicators
- Highlight pending orders count

---

### 2. Sales Trend
**Endpoint:** `GET /api/admin/dashboard/sales-trend?days=30`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2025-10-23",
      "orders": 2,
      "revenue": 127,
      "items": 3
    }
  ]
}
```

**Use Cases:**
- Line chart showing sales trend over time
- Display orders, revenue, and items sold per day
- Customizable date range (default 30 days)

---

### 3. Top Products
**Endpoint:** `GET /api/admin/dashboard/top-products?limit=10`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "2390",
      "productName": "SABUDANA 250 (N.W.)",
      "totalQuantity": 3,
      "totalRevenue": 54,
      "orderCount": 2
    },
    {
      "_id": "1001",
      "productName": "ORALB T/B SEN WHITE-SOFT",
      "totalQuantity": 1,
      "totalRevenue": 54,
      "orderCount": 1
    }
  ]
}
```

**Use Cases:**
- Table/list of top selling products
- Show quantity sold, revenue, and order count
- Sortable by different metrics

---

### 4. Top Categories
**Endpoint:** `GET /api/admin/dashboard/top-categories?limit=10`

**Tested Response:**
```json
{
  "success": true,
  "data": []
}
```

**Use Cases:**
- Display top performing categories
- Show product count and total stock per category
- Pie chart or bar chart visualization

---

### 5. Recent Orders
**Endpoint:** `GET /api/admin/dashboard/recent-orders?limit=10`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "customer_info": {
        "name": "Test User",
        "email": "test@example.com"
      },
      "order_summary": {
        "total_amount": 106
      },
      "_id": "68fa14663891334f53bb4cfe",
      "order_number": "ORD2510230002",
      "mobile_no": "9876543210",
      "order_status": "placed",
      "order_placed_at": "2025-10-23T11:41:26.639Z"
    },
    {
      "customer_info": {
        "name": "Test User",
        "email": "test@example.com"
      },
      "order_summary": {
        "total_amount": 21
      },
      "_id": "68fa0f0ad046804e33d2ca22",
      "order_number": "ORD2510230001",
      "mobile_no": "9876543210",
      "order_status": "placed",
      "order_placed_at": "2025-10-23T11:18:34.717Z"
    }
  ]
}
```

**Use Cases:**
- Recent orders table/timeline
- Show order number, customer, amount, status
- Link to order details page

---

### 6. Order Status Distribution
**Endpoint:** `GET /api/admin/dashboard/order-status-distribution`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "placed",
      "count": 2,
      "totalValue": 127
    }
  ]
}
```

**Use Cases:**
- Pie chart showing order status breakdown
- Display count and total value per status
- Color-coded by status type

---

### 7. Payment Status Distribution
**Endpoint:** `GET /api/admin/dashboard/payment-status-distribution`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "pending",
      "count": 2,
      "totalValue": 127
    }
  ]
}
```

**Use Cases:**
- Pie chart showing payment status breakdown
- Display count and total value per payment status
- Highlight pending/failed payments

---

### 8. User Activity
**Endpoint:** `GET /api/admin/dashboard/user-activity`

**Tested Response:**
```json
{
  "success": true,
  "data": {
    "activeLastHour": 1,
    "activeLastDay": 4,
    "activeLastWeek": 7
  }
}
```

**Use Cases:**
- Display active user counts
- Show engagement metrics
- Activity timeline or stats cards

---

## Implementation Plan

### Phase 1: Service Layer & Types

#### 1.1 Create Dashboard Service
**File:** `admin_panel/src/services/dashboard.ts` (new file)

**Functions:**
- `getDashboardOverview()` - Get overview statistics
- `getSalesTrend(days?: number)` - Get sales trend data
- `getTopProducts(limit?: number)` - Get top products
- `getTopCategories(limit?: number)` - Get top categories
- `getRecentOrders(limit?: number)` - Get recent orders
- `getOrderStatusDistribution()` - Get order status distribution
- `getPaymentStatusDistribution()` - Get payment status distribution
- `getUserActivity()` - Get user activity stats

#### 1.2 Add TypeScript Types
**File:** `admin_panel/src/types/api.ts` (update)

**Add Types:**
```typescript
// Dashboard Overview
export interface DashboardOverview {
  users: {
    total: number;
    newToday: number;
    newThisMonth: number;
    newLastMonth: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    pending: number;
    growth: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
    lastMonth: number;
    averageOrderValue: number;
    growth: number | null;
  };
}

// Sales Trend
export interface SalesTrendData {
  _id: string; // Date string (YYYY-MM-DD)
  orders: number;
  revenue: number;
  items: number;
}

// Top Products
export interface TopProduct {
  _id: string; // Product code
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

// Top Categories
export interface TopCategory {
  _id: string; // Category ID
  categoryName: string;
  productCount: number;
  totalStock: number;
}

// Recent Orders
export interface RecentOrder {
  _id: string;
  order_number: string;
  mobile_no: string;
  order_status: string;
  order_placed_at: string;
  customer_info: {
    name: string;
    email: string;
  };
  order_summary: {
    total_amount: number;
  };
}

// Status Distribution
export interface StatusDistribution {
  _id: string; // Status name
  count: number;
  totalValue: number;
}

// User Activity
export interface UserActivity {
  activeLastHour: number;
  activeLastDay: number;
  activeLastWeek: number;
}
```

---

### Phase 2: Update Dashboard Components

#### 2.1 Update Analytics Widget Summary
**File:** `admin_panel/src/sections/overview/analytics-widget-summary.tsx`

**Changes:**
- Replace mock data with API call
- Display real metrics from overview API
- Show 4 key metric cards:
  1. **Total Revenue** - with growth percentage
  2. **Total Orders** - with pending count
  3. **Total Users** - with new users today
  4. **Total Products** - with active/out of stock counts

#### 2.2 Create Sales Trend Chart Component
**File:** `admin_panel/src/sections/overview/analytics-sales-trend.tsx` (new file)

**Features:**
- Line chart showing sales trend
- Display orders, revenue, and items over time
- Date range selector (7, 30, 90 days)
- Tooltip showing detailed data on hover

#### 2.3 Create Top Products Component
**File:** `admin_panel/src/sections/overview/analytics-top-products.tsx` (new file)

**Features:**
- Table/list of top products
- Columns: Product Name, Quantity Sold, Revenue, Orders
- Sortable columns
- Link to product details

#### 2.4 Create Top Categories Component
**File:** `admin_panel/src/sections/overview/analytics-top-categories.tsx` (new file)

**Features:**
- Bar chart or table showing top categories
- Display category name, product count, total stock
- Visual representation (chart)

#### 2.5 Update Recent Orders Component
**File:** `admin_panel/src/sections/overview/analytics-order-timeline.tsx` (update)

**Changes:**
- Replace mock data with API call
- Display real recent orders
- Show order number, customer, amount, status, date
- Link to order details page

#### 2.6 Create Order Status Chart Component
**File:** `admin_panel/src/sections/overview/analytics-order-status.tsx` (new file)

**Features:**
- Pie chart showing order status distribution
- Color-coded by status
- Show count and total value
- Legend with percentages

#### 2.7 Create Payment Status Chart Component
**File:** `admin_panel/src/sections/overview/analytics-payment-status.tsx` (new file)

**Features:**
- Pie chart showing payment status distribution
- Color-coded by payment status
- Highlight pending/failed payments
- Show count and total value

#### 2.8 Create User Activity Component
**File:** `admin_panel/src/sections/overview/analytics-user-activity.tsx` (new file)

**Features:**
- Display active user counts
- Cards showing: Last Hour, Last 24 Hours, Last 7 Days
- Visual indicators for engagement

---

### Phase 3: Update Main Dashboard View

#### 3.1 Update Overview Analytics View
**File:** `admin_panel/src/sections/overview/view/overview-analytics-view.tsx`

**Layout Structure:**
```
Dashboard
├─ Welcome Header
├─ Key Metrics Cards (4 cards - Revenue, Orders, Users, Products)
├─ Charts Row 1
│   ├─ Sales Trend Chart (Line Chart)
│   └─ Order Status Distribution (Pie Chart)
├─ Charts Row 2
│   ├─ Payment Status Distribution (Pie Chart)
│   └─ Top Categories (Bar Chart)
├─ Tables Row
│   ├─ Top Products Table
│   └─ Recent Orders Table
└─ User Activity Cards
```

**Changes:**
- Replace all mock data imports with API calls
- Add loading states for all components
- Add error handling
- Implement data fetching on component mount
- Add refresh functionality

---

### Phase 4: State Management & Data Fetching

#### 4.1 Dashboard State Management
- Use React hooks (useState, useEffect) for data fetching
- Implement loading states for each section
- Handle error states gracefully
- Cache data with refetch intervals (optional)

#### 4.2 Data Fetching Strategy
- Fetch overview data on mount
- Fetch all dashboard data in parallel
- Show loading skeletons while fetching
- Display error messages if API fails

---

## UI/UX Considerations

### Loading States
- Show skeleton loaders for each component
- Use CircularProgress for initial load
- Smooth transitions when data loads

### Error Handling
- Display error alerts if API fails
- Retry button for failed requests
- Fallback to empty states

### Empty States
- Show appropriate messages when no data
- Suggest actions (e.g., "No orders yet - start selling!")

### Data Formatting
- Format currency values (₹ symbol, commas)
- Format dates (relative time: "2 hours ago")
- Format percentages (with +/- indicators)
- Format large numbers (K, M abbreviations)

### Visual Indicators
- Green for positive growth
- Red for negative growth
- Color-coded status badges
- Trend arrows (↑ ↓)

### Responsive Design
- Mobile-friendly layout
- Stack cards on small screens
- Horizontal scroll for tables on mobile

---

## Component Mapping

| API Endpoint | Component | Display Type |
|-------------|-----------|--------------|
| `/overview` | AnalyticsWidgetSummary (4 cards) | Cards with charts |
| `/sales-trend` | AnalyticsSalesTrend | Line Chart |
| `/top-products` | AnalyticsTopProducts | Table |
| `/top-categories` | AnalyticsTopCategories | Bar Chart |
| `/recent-orders` | AnalyticsOrderTimeline | Timeline/Table |
| `/order-status-distribution` | AnalyticsOrderStatus | Pie Chart |
| `/payment-status-distribution` | AnalyticsPaymentStatus | Pie Chart |
| `/user-activity` | AnalyticsUserActivity | Stats Cards |

---

## Implementation Order

1. **Phase 1: Foundation**
   - Create dashboard service file
   - Add TypeScript types
   - Test API calls

2. **Phase 2: Core Components**
   - Update AnalyticsWidgetSummary with real data
   - Create Sales Trend chart component
   - Create Order Status chart component
   - Create Payment Status chart component

3. **Phase 3: Tables & Lists**
   - Create Top Products component
   - Create Top Categories component
   - Update Recent Orders component

4. **Phase 4: Additional Features**
   - Create User Activity component
   - Add loading states
   - Add error handling
   - Add data refresh functionality

5. **Phase 5: Polish**
   - Format data display
   - Add tooltips
   - Responsive design
   - Performance optimization

---

## File Structure

```
admin_panel/src/
├── services/
│   └── dashboard.ts (NEW)
├── types/
│   └── api.ts (UPDATE)
└── sections/
    └── overview/
        ├── analytics-widget-summary.tsx (UPDATE)
        ├── analytics-sales-trend.tsx (NEW)
        ├── analytics-top-products.tsx (NEW)
        ├── analytics-top-categories.tsx (NEW)
        ├── analytics-order-status.tsx (NEW)
        ├── analytics-payment-status.tsx (NEW)
        ├── analytics-user-activity.tsx (NEW)
        ├── analytics-order-timeline.tsx (UPDATE)
        └── view/
            └── overview-analytics-view.tsx (UPDATE)
```

---

## Notes

- All APIs return consistent `{ success: true, data: {...} }` structure
- Growth percentages can be negative (indicate with red color)
- Revenue growth can be `null` (handle gracefully)
- Some endpoints may return empty arrays (show empty states)
- Dates are in ISO format (format for display)
- Order statuses: placed, confirmed, processing, packed, shipped, delivered, cancelled, refunded
- Payment statuses: pending, processing, completed, failed, cancelled

---

## Testing Checklist

- [ ] Test all 8 API endpoints
- [ ] Verify data formatting (currency, dates, percentages)
- [ ] Test loading states
- [ ] Test error handling
- [ ] Test empty states
- [ ] Test responsive design
- [ ] Verify chart rendering
- [ ] Test data refresh
- [ ] Verify navigation links work

