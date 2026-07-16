# Admin Panel Store Code Integration Plan

## Overview
Add store code selection dropdown in the Ecommerce section of the navbar. The selected store code will be used to filter all ecommerce-related API calls (products, categories, departments, subcategories).

## Implementation Steps

### 1. Create Store Code Context
**File:** `admin_panel/src/contexts/store-code-context.tsx` (new file)

**Purpose:** Manage selected store code state globally

**Features:**
- Store selected store code in context
- Persist to localStorage for page refresh
- Provide hook `useStoreCode()` for components to access selected store code
- Provide `setStoreCode()` function to update selected store code

**Structure:**
```typescript
interface StoreCodeContextType {
  storeCode: string | null;
  setStoreCode: (code: string | null) => void;
  isLoading: boolean;
}
```

### 2. Create Store Codes Service
**File:** `admin_panel/src/services/stores.ts` (update existing or create)

**Function:** `getAllStoreCodes()` - Fetch store codes from `/api/admin/content/stores/codes`

**Response Type:**
```typescript
interface StoreCode {
  store_code: string;
  store_name: string;
}
```

### 3. Create Store Code Selector Component
**File:** `admin_panel/src/layouts/components/store-code-selector.tsx` (new file)

**Purpose:** Dropdown component for selecting store code

**Features:**
- Fetch store codes on mount
- Display dropdown with store codes
- Show selected store code
- Handle loading and error states
- Update context when selection changes

**UI:**
- Material-UI Select component
- Placeholder: "Select Store Code"
- Show store name in dropdown: "STORE_CODE - Store Name"
- Display selected store code prominently

### 4. Integrate Store Code Selector in Navbar
**File:** `admin_panel/src/layouts/dashboard/nav.tsx`

**Changes:**
- Add store code selector in the Ecommerce section
- Display selector when Ecommerce section is expanded
- Position selector below Ecommerce title, above children items
- Only show when on ecommerce routes (`/ecommerce/*`)

**Visual Structure:**
```
Ecommerce (expandable)
  ├─ [Store Code Selector Dropdown]
  ├─ Departments
  ├─ Categories
  ├─ Subcategories
  └─ Products
```

### 5. Update Ecommerce Pages to Use Store Code

#### 5.1 Products Page
**File:** `admin_panel/src/pages/ecommerce/products.tsx`

**Changes:**
- Use `useStoreCode()` hook to get selected store code
- Show warning/alert if no store code selected
- Use `POST /api/admin/products/by-store` instead of GET endpoint
- Pass `store_code` in request body
- Add search functionality
- Display products filtered by store code

#### 5.2 Categories Page
**File:** `admin_panel/src/pages/ecommerce/categories.tsx`

**Changes:**
- Use `useStoreCode()` hook
- Show warning if no store code selected
- Use `POST /api/admin/categories/by-store`
- Pass `store_code` in request body

#### 5.3 Departments Page
**File:** `admin_panel/src/pages/ecommerce/departments.tsx`

**Changes:**
- Use `useStoreCode()` hook
- Show warning if no store code selected
- Use `POST /api/admin/categories/departments/by-store`
- Pass `store_code` in request body

#### 5.4 Subcategories Page
**File:** `admin_panel/src/pages/ecommerce/subcategories.tsx`

**Changes:**
- Use `useStoreCode()` hook
- Show warning if no store code selected
- Use `POST /api/admin/categories/subcategories/by-store`
- Pass `store_code` in request body

### 6. Update Services

#### 6.1 Products Service
**File:** `admin_panel/src/services/products.ts` (new file)

**Function:** `getProductsByStore(params)` - Call POST endpoint with store_code

#### 6.2 Categories Service
**File:** `admin_panel/src/services/categories.ts` (new file)

**Function:** `getCategoriesByStore(params)` - Call POST endpoint with store_code

#### 6.3 Departments Service
**File:** `admin_panel/src/services/departments.ts` (new file)

**Function:** `getDepartmentsByStore(params)` - Call POST endpoint with store_code

#### 6.4 Subcategories Service
**File:** `admin_panel/src/services/subcategories.ts` (new file)

**Function:** `getSubcategoriesByStore(params)` - Call POST endpoint with store_code

### 7. Add TypeScript Types
**File:** `admin_panel/src/types/api.ts`

**Add Types:**
- `StoreCode` interface
- Query parameter interfaces for each POST endpoint
- Response types matching backend structure

### 8. Wrap App with Store Code Provider
**File:** `admin_panel/src/app.tsx`

**Changes:**
- Wrap application with `StoreCodeProvider`
- Ensure context is available to all components

## File Structure

```
admin_panel/src/
├── contexts/
│   └── store-code-context.tsx (NEW)
├── layouts/
│   ├── components/
│   │   └── store-code-selector.tsx (NEW)
│   └── dashboard/
│       └── nav.tsx (MODIFY)
├── pages/
│   └── ecommerce/
│       ├── products.tsx (MODIFY)
│       ├── categories.tsx (MODIFY)
│       ├── departments.tsx (MODIFY)
│       └── subcategories.tsx (MODIFY)
├── services/
│   ├── stores.ts (UPDATE/CREATE)
│   ├── products.ts (NEW)
│   ├── categories.ts (NEW)
│   ├── departments.ts (NEW)
│   └── subcategories.ts (NEW)
└── types/
    └── api.ts (UPDATE)
```

## User Flow

1. Admin opens admin panel
2. Admin navigates to Ecommerce section in navbar
3. Ecommerce section expands, showing store code selector dropdown
4. Admin selects a store code from dropdown
5. Selected store code is saved in context and localStorage
6. Admin navigates to any ecommerce page (Products, Categories, etc.)
7. Page automatically filters data by selected store code
8. If no store code selected, page shows warning message
9. Admin can change store code anytime from navbar dropdown
10. All ecommerce pages update automatically when store code changes

## UI/UX Considerations

1. **Store Code Selector:**
   - Visible only when Ecommerce section is expanded
   - Sticky/persistent when navigating between ecommerce pages
   - Clear visual indication of selected store code
   - Loading state while fetching store codes
   - Error handling if API fails

2. **Page Warnings:**
   - Show alert/notice if no store code selected
   - Suggest selecting store code to view data
   - Disable data fetching until store code is selected

3. **Loading States:**
   - Show loading spinner while fetching data
   - Show skeleton loaders for better UX

4. **Empty States:**
   - Show appropriate message when no data found
   - Suggest checking store code selection

## Implementation Order

1. **Phase 1: Foundation**
   - Create store code context
   - Create store codes service
   - Add TypeScript types

2. **Phase 2: UI Components**
   - Create store code selector component
   - Integrate in navbar

3. **Phase 3: Service Layer**
   - Create/update service files for all endpoints
   - Test API calls

4. **Phase 4: Page Integration**
   - Update Products page
   - Update Categories page
   - Update Departments page
   - Update Subcategories page

5. **Phase 5: Testing & Polish**
   - Test store code selection flow
   - Test data filtering
   - Test error handling
   - Test persistence across page refreshes

## API Responses (Tested)

### 1. Get Store Codes
**Endpoint:** `GET /api/admin/content/stores/codes`

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "store_code": "AMCH",
      "store_name": "Badlapur-Kalyan Rd,Chikhloli Ambernath West "
    },
    {
      "store_code": "AME",
      "store_name": "Shivaji Chowk, Ambernath (E)"
    },
    {
      "store_code": "AMSN",
      "store_name": "Shivganga Nagar Ambernath (E)"
    },
    {
      "store_code": "AMW",
      "store_name": "Near MCA,Station Rd.Ambernath (W)"
    },
    {
      "store_code": "AVB",
      "store_name": "AMBADI VILLAGE BHIWANDI"
    },
    {
      "store_code": "BAP",
      "store_name": "HARI OM TIMBER MART COMPOUND"
    },
    {
      "store_code": "BBVR",
      "store_name": "NANA NANI PARK BHIWANDI "
    },
    {
      "store_code": "BES",
      "store_name": "SURVAL CHOWK"
    },
    {
      "store_code": "BHAR",
      "store_name": "PAREKH TIMBER MART COMPOUND"
    },
    {
      "store_code": "BKHE",
      "store_name": "Kharvai Naka, Badlapur (E) "
    },
    {
      "store_code": "BLEB",
      "store_name": "Gandhi Chowk Badlapur (E)"
    },
    {
      "store_code": "BLEK",
      "store_name": "Katrap Naka Badlapur (E)"
    },
    {
      "store_code": "BLWB",
      "store_name": "Sanewadi Badlapur (W) "
    },
    {
      "store_code": "BWM",
      "store_name": "Ganesh Chowk Manjari"
    },
    {
      "store_code": "DAG",
      "store_name": "AZDE GAON DOMBIVLI EAST"
    },
    {
      "store_code": "DNE",
      "store_name": "Nandivili, Dombivli (E)"
    },
    {
      "store_code": "DOE",
      "store_name": "Rajaji Path,Dombivli (E)"
    },
    {
      "store_code": "DOF",
      "store_name": "Phadke Rd.Dombivli (E)."
    },
    {
      "store_code": "DOM",
      "store_name": "MANPADA  ROAD DOMBVALI (E)"
    },
    {
      "store_code": "DOW",
      "store_name": "Kopar Rd.Dombivli (W)"
    },
    {
      "store_code": "DOWSMT",
      "store_name": "Samrat Chowk, Dombivli (W)"
    },
    {
      "store_code": "DSR",
      "store_name": "DIVA SHILL ROAD"
    },
    {
      "store_code": "DWK",
      "store_name": "KUMBHARKHAN PADA DOMBIVLI(W)"
    },
    {
      "store_code": "KBR",
      "store_name": "UTSAV LODGE.RANJNOLI,BHIWANDI"
    },
    {
      "store_code": "KET",
      "store_name": "ASHTAMI CHS,VIJAYNAGAR,"
    },
    {
      "store_code": "KHP",
      "store_name": "Khopoli phata "
    },
    {
      "store_code": "KKW",
      "store_name": "Shankeshwar Plantina Koliwali Road"
    },
    {
      "store_code": "KLE",
      "store_name": "Netivili, Kalyan (E) "
    },
    {
      "store_code": "KLK",
      "store_name": "Khadkpada, Kalyan (W)"
    },
    {
      "store_code": "KLT",
      "store_name": "Tilak Chowk, Kalyan (W)"
    },
    {
      "store_code": "KLW",
      "store_name": "Rambaug Kalyan (W) "
    },
    {
      "store_code": "KMR",
      "store_name": "KHONI MIDC ROAD"
    },
    {
      "store_code": "MUBD",
      "store_name": "Sonar Pada, Murbad "
    },
    {
      "store_code": "NKR",
      "store_name": "BADLAPUR-KARJAT ROAD TIWALE "
    },
    {
      "store_code": "NWM",
      "store_name": "NICE WORLD MUMBRA "
    },
    {
      "store_code": "PAD",
      "store_name": "MOTIRAM RESIDENCY.OM SAI NAGAR"
    },
    {
      "store_code": "SHAP",
      "store_name": "Nr.S.T.Depot, Shahapur "
    },
    {
      "store_code": "SHD",
      "store_name": "Nr.Railway Stn.Shahad "
    },
    {
      "store_code": "TTL",
      "store_name": "Ganesh Mandir Rd.Titwala (E)"
    },
    {
      "store_code": "ULN",
      "store_name": "Ulhasnagar No.2"
    },
    {
      "store_code": "ULN4",
      "store_name": "Venus Chowk, Ulhasnagar No.4"
    },
    {
      "store_code": "VAS",
      "store_name": "OLD AGRA ROAD NEAR CHAUBAL WADA (VASIND)"
    },
    {
      "store_code": "VGW",
      "store_name": "VANGANI"
    }
  ]
}
```

**Notes:**
- Returns unique store codes (duplicates removed)
- Total: ~45 unique store codes
- Sorted alphabetically by store_code

---

### 2. Get Products by Store Code
**Endpoint:** `POST /api/admin/products/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "search": "",
  "page": 1,
  "limit": 5
}
```

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "68c236c4bf96087eee211e41",
      "p_code": "20620",
      "barcode": "20620",
      "product_name": "13x19 MIX MAT",
      "product_description": "UN BRAND DOOR MAT (PLASTIC)  1 NO PLS",
      "package_size": 1,
      "package_unit": "NO",
      "product_mrp": 55,
      "our_price": 39,
      "brand_name": "UN BRAND",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "1",
      "category_id": "91",
      "sub_category_id": "359",
      "store_quantity": 11,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/20620_1.webp"
    },
    {
      "id": "68c236c4bf96087eee211235",
      "p_code": "23263",
      "barcode": "23263",
      "product_name": "1ND CHA NACNI PAPAD 200GM",
      "product_description": "IND CHA PAPAD PAPAD  200 GM",
      "package_size": 200,
      "package_unit": "GM",
      "product_mrp": 70,
      "our_price": 35,
      "brand_name": "IND CHA PAPAD",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "2",
      "category_id": "72",
      "sub_category_id": "391",
      "store_quantity": 10,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/23263_1.webp"
    },
    {
      "id": "68c23691bf96087eee1e0833",
      "p_code": "29686",
      "barcode": "8906059291289",
      "product_name": "2 PC. COOKWARE SET",
      "product_description": "MEE ENTARPRISE NON STICK NON STICK  1 NO",
      "package_size": 1,
      "package_unit": "NO",
      "product_mrp": 0,
      "our_price": 269,
      "brand_name": "MEE ENTARPRISE",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "1",
      "category_id": "91",
      "sub_category_id": "360",
      "store_quantity": 0,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/29686_1.webp"
    },
    {
      "id": "68c236c4bf96087eee211e6c",
      "p_code": "20618",
      "barcode": "20618",
      "product_name": "24x16 LEHAR",
      "product_description": "UN BRAND DOOR MAT (PLASTIC)  1 NO PLS",
      "package_size": 1,
      "package_unit": "NO",
      "product_mrp": 65,
      "our_price": 49,
      "brand_name": "UN BRAND",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "1",
      "category_id": "38",
      "sub_category_id": "267",
      "store_quantity": 20,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/20618_1.webp"
    },
    {
      "id": "68c2368ebf96087eee1de001",
      "p_code": "29682",
      "barcode": "8906089554705",
      "product_name": "4 PC. COOKWARE SET",
      "product_description": "MEE ENTARPRISE NON STICK NON STICK  1 NO",
      "package_size": 1,
      "package_unit": "NO",
      "product_mrp": 1699,
      "our_price": 899,
      "brand_name": "MEE ENTARPRISE",
      "store_code": "AME",
      "pcode_status": "Y",
      "dept_id": "1",
      "category_id": "91",
      "sub_category_id": "360",
      "store_quantity": 0,
      "max_quantity_allowed": 10,
      "pcode_img": "https://retailmagic.in/cdn/RET3163/29682_1.webp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 5706,
    "pages": 1142
  }
}
```

**Notes:**
- Store "AME" has 5,706 total products
- All products have `pcode_status: "Y"` (active)
- Products include images, pricing, stock quantities
- Pagination shows 1,142 pages with limit of 5

---

### 3. Get Categories by Store Code
**Endpoint:** `POST /api/admin/categories/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "page": 1,
  "limit": 5
}
```

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68a8a2804169ced4c49f968b",
      "idcategory_master": "104",
      "category_name": "COLDDRINK / FRUITDRINK",
      "dept_id": "11",
      "sequence_id": 0,
      "store_code": "AME",
      "no_of_col": "6",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/COLDDRINK&FRUITDRINK_1.jpg",
      "category_bg_color": "#FFFF00",
      "__v": 0
    },
    {
      "_id": "68a8a2804169ced4c49f968c",
      "idcategory_master": "104",
      "category_name": "COLDDRINK / FRUITDRINK",
      "dept_id": "11",
      "sequence_id": 0,
      "store_code": "AMW",
      "no_of_col": "6",
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/category/thumbnail/COLDDRINK&FRUITDRINK_1.jpg",
      "category_bg_color": "#FFFF00",
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 3830,
    "pages": 766
  }
}
```

**Notes:**
- Store "AME" has 3,830 total categories
- Categories include images and background colors
- Categories are linked to departments via `dept_id`

---

### 4. Get Departments by Store Code
**Endpoint:** `POST /api/admin/categories/departments/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "page": 1,
  "limit": 5
}
```

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "68a8a27d4169ced4c49f94ce",
      "department_id": "1",
      "department_name": "HOUSEHOLD ITEMS",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/HOUSEHOLD-ITEMS.webp",
      "sequence_id": 1,
      "__v": 0
    },
    {
      "_id": "68a8a27d4169ced4c49f94d6",
      "department_id": "11",
      "department_name": "SEASONAL PICKS",
      "dept_type_id": "2",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/july_seasonalpick_banner.gif",
      "sequence_id": 1,
      "__v": 0
    },
    {
      "_id": "68a8a27d4169ced4c49f94cf",
      "department_id": "2",
      "department_name": "GROCERY & STAPLES",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/GROCERY&STAPLES.webp",
      "sequence_id": 2,
      "__v": 0
    },
    {
      "_id": "68a8a27d4169ced4c49f94d0",
      "department_id": "3",
      "department_name": "PERSONAL CARE",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/PERSONALCARE.webp",
      "sequence_id": 3,
      "__v": 0
    },
    {
      "_id": "68a8a27d4169ced4c49f94d1",
      "department_id": "4",
      "department_name": "BABY CARE",
      "dept_type_id": "1",
      "dept_no_of_col": 0,
      "store_code": null,
      "image_link": "https://patelrmart.com/mgmt_panel/sites/default/files/department/thumbnail/BABYCARE.webp",
      "sequence_id": 4,
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 9,
    "pages": 2
  }
}
```

**Notes:**
- Total of 9 departments
- Most departments have `store_code: null` (global departments)
- Departments include images and sequence ordering

---

### 5. Get Subcategories by Store Code
**Endpoint:** `POST /api/admin/categories/subcategories/by-store`

**Request Body:**
```json
{
  "store_code": "AME",
  "page": 1,
  "limit": 5
}
```

**Tested Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6891b9aa9cdf8ee98b590865",
      "idsub_category_master": "4",
      "sub_category_name": "SOYABEAN OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    },
    {
      "_id": "6891b9aa9cdf8ee98b590866",
      "idsub_category_master": "5",
      "sub_category_name": "OLIVE OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    },
    {
      "_id": "6891b9aa9cdf8ee98b590863",
      "idsub_category_master": "2",
      "sub_category_name": "MUSTARD OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    },
    {
      "_id": "6891b9aa9cdf8ee98b590862",
      "idsub_category_master": "1",
      "sub_category_name": "HEALTH OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    },
    {
      "_id": "6891b9aa9cdf8ee98b590864",
      "idsub_category_master": "3",
      "sub_category_name": "SUNFLOWER OILS",
      "category_id": "2",
      "main_category_name": "EDIBLE OILS",
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 388,
    "pages": 78
  }
}
```

**Notes:**
- Store "AME" has 388 total subcategories
- Subcategories are linked to categories via `category_id`
- Each subcategory includes `main_category_name` for display

---

## Error Response Examples

### Missing store_code
```json
{
  "success": false,
  "message": "store_code is required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Error fetching products",
  "error": "Detailed error message"
}
```

---

## Notes

- Store code selection persists across page refreshes (localStorage)
- Store code is required for all ecommerce API calls
- If store code is not selected, pages should show warning, not fetch data
- Store code selector should be visually distinct in navbar
- Consider adding "Clear Selection" option to reset store code
- All tested APIs return consistent pagination structure
- Products use ProductMaster model (different from Product model)
- Departments can have `store_code: null` (global departments)
- Subcategories are filtered indirectly via categories

