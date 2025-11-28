# DP20 Package Purchase - Backend Implementation Guide

## Overview

This document explains the complete backend setup for the DP20 package purchase system, including database schema, services, and admin workflow.

## Database Setup

### 1. Run SQL Migrations (In Order)

Execute these SQL files in your Supabase SQL Editor:

```bash
# 1. Add DP20 balance fields to users table
supabase/add-dp20-package-system.sql

# 2. Add package purchase tracking table
supabase/add-dp20-purchase-tracking.sql
```

### 2. Database Schema

#### **users table** (DP20 fields added)
```sql
dp20_balance INTEGER         -- Number of remaining visits (0-20)
dp20_expiry TIMESTAMP        -- Expiry date (90 days from assignment)
```

#### **package_purchases table** (NEW)
Tracks DP20 purchases before admin confirmation:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References users.id |
| `package_type` | TEXT | 'DP20', 'BR15', 'BR30' |
| `amount` | DECIMAL | Purchase amount (1000 for DP20) |
| `customer_name` | TEXT | Name at purchase time |
| `customer_email` | TEXT | Email at purchase time |
| `customer_phone` | TEXT | Phone at purchase time |
| `receipt_url` | TEXT | Supabase storage URL |
| `status` | TEXT | 'pending', 'approved', 'rejected', 'expired' |
| `admin_notes` | TEXT | Notes from admin |
| `processed_by` | UUID | Admin who processed |
| `processed_at` | TIMESTAMP | When processed |

#### **package_history table** (UPDATED)
Now includes 'DP20' in package_type constraint.

### 3. Database Functions

#### `approve_dp20_purchase(purchase_id, admin_id, notes)`
Atomically:
1. Assigns DP20 package to user (20 visits, 90-day expiry)
2. Records in package_history
3. Updates purchase status to 'approved'

#### `reject_purchase(purchase_id, admin_id, rejection_reason)`
Marks purchase as rejected with admin notes.

#### `check_dp20_valid(user_id)`
Returns boolean: user has valid DP20 balance (>0 and not expired).

### 4. Row Level Security (RLS) Policies

**package_purchases table:**
- ✅ Users can SELECT their own purchases
- ✅ Users can INSERT their own purchases
- ✅ Admins can SELECT all purchases
- ✅ Admins can UPDATE all purchases

## Frontend Services

### packagePurchaseService (NEW)

Located: `src/services/packagePurchaseService.js`

#### Key Functions:

```javascript
// Create purchase record after receipt upload
await packagePurchaseService.createPurchase({
  packageType: 'DP20',
  amount: 1000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+852 1234 5678',
  receiptUrl: 'https://...'
});

// Get user's purchase history
await packagePurchaseService.getUserPurchases();

// Admin: Get all pending purchases
await packagePurchaseService.getPendingPurchases();

// Admin: Approve purchase (assigns package to user)
await packagePurchaseService.approvePurchase(purchaseId, 'Approved - payment verified');

// Admin: Reject purchase
await packagePurchaseService.rejectPurchase(purchaseId, 'Invalid receipt');
```

## User Purchase Flow

### 1. User Side (Frontend)

**Path:** /rooms → Click "購買此套票 💰" on DP20 Package card

1. **DP20PurchaseModal opens**
   - Pre-fills name, email, phone from user profile
   - User uploads payment receipt (HK$1,000)

2. **Receipt upload** (DP20PurchaseModal.jsx:115-151)
   ```javascript
   // Upload receipt to Supabase storage
   const uploadResult = await storageService.uploadReceipt(filename, file);

   // Create purchase record in database
   const purchaseResult = await packagePurchaseService.createPurchase({
     packageType: 'DP20',
     amount: 1000,
     customerName: formData.name,
     customerEmail: formData.email,
     customerPhone: formData.phone,
     receiptUrl: uploadResult.url
   });
   ```

3. **Success screen**
   - Shows WhatsApp button
   - Opens pre-filled message to admin (85266238788)
   - Message includes: name, email, phone, purchase confirmation

4. **Database state after purchase:**
   ```sql
   -- package_purchases table
   {
     id: 'uuid',
     user_id: 'user-uuid',
     package_type: 'DP20',
     amount: 1000,
     status: 'pending',  // ⬅️ Awaiting admin
     receipt_url: 'https://...',
     customer_name: 'John Doe',
     customer_email: 'john@example.com',
     customer_phone: '+852 1234 5678'
   }

   -- users table (BEFORE approval)
   {
     dp20_balance: 0,      // ⬅️ Not assigned yet
     dp20_expiry: null
   }
   ```

### 2. Admin Side (Backend Approval)

**TODO: Implement admin UI for package purchase management**

Admin needs to:

1. **View pending purchases**
   - New admin tab: "Package Purchases" (待實現)
   - Shows list of pending DP20 purchases
   - Displays: user, amount, receipt, timestamp

2. **Review receipt**
   - Click to view receipt image/PDF
   - Verify payment matches HK$1,000

3. **Approve or Reject**

   **Option A: Approve via SQL (manual)**
   ```sql
   SELECT approve_dp20_purchase(
     'purchase-uuid'::UUID,
     'admin-uuid'::UUID,
     'Payment verified - approved'
   );
   ```

   **Option B: Approve via Service (recommended)**
   ```javascript
   // In future admin UI component
   await packagePurchaseService.approvePurchase(
     purchaseId,
     'Payment verified - approved'
   );
   ```

4. **After approval, database state:**
   ```sql
   -- package_purchases table
   {
     status: 'approved',         // ⬅️ Processed
     processed_by: 'admin-uuid',
     processed_at: '2025-11-24...',
     admin_notes: 'Payment verified - approved'
   }

   -- users table (AFTER approval)
   {
     dp20_balance: 20,           // ⬅️ Assigned!
     dp20_expiry: '2025-02-22...' // 90 days from now
   }

   -- package_history table (NEW RECORD)
   {
     user_id: 'user-uuid',
     package_type: 'DP20',
     br_amount: 20,
     assigned_by: 'admin-uuid',
     reason: 'DP20 package purchase approved - HK$1000'
   }
   ```

## Admin UI Implementation (TODO)

### Recommended Location
`src/components/admin/PackagePurchasesTab.jsx`

### UI Features Needed:

1. **Purchase List Table**
   ```
   | Receipt | Customer | Email | Phone | Amount | Status | Actions |
   |---------|----------|-------|-------|--------|--------|---------|
   | [View]  | John Doe | j@... | +852  | $1000  | Pending| [✓][✗] |
   ```

2. **Receipt View Modal**
   - Similar to `ReceiptViewModal.jsx`
   - Zoom, drag, download

3. **Approve/Reject Buttons**
   - Calls `packagePurchaseService.approvePurchase()`
   - Calls `packagePurchaseService.rejectPurchase()`

4. **Status Filters**
   - Pending (default)
   - Approved
   - Rejected

### Sample Component Structure:

```javascript
// src/components/admin/PackagePurchasesTab.jsx
export const PackagePurchasesTab = () => {
  const [purchases, setPurchases] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const loadPurchases = async () => {
      const result = await packagePurchaseService.getAllPurchases({
        status: filter
      });
      setPurchases(result.purchases);
    };
    loadPurchases();
  }, [filter]);

  const handleApprove = async (purchaseId) => {
    await packagePurchaseService.approvePurchase(purchaseId);
    // Refresh list
  };

  // ... UI rendering
};
```

## Testing Checklist

### Database Setup
- [ ] Run `add-dp20-package-system.sql`
- [ ] Run `add-dp20-purchase-tracking.sql`
- [ ] Verify `package_purchases` table exists
- [ ] Verify RLS policies active

### User Purchase Flow
- [ ] Navigate to /rooms
- [ ] See DP20 Package card next to Day Pass
- [ ] Click "購買此套票 💰"
- [ ] Modal opens with form
- [ ] Fill name, email, phone
- [ ] Upload receipt image/PDF
- [ ] See success screen
- [ ] Click WhatsApp button → Opens with pre-filled message
- [ ] Check Supabase: `package_purchases` has new pending record
- [ ] Check storage bucket: receipt file exists

### Admin Approval (Manual via SQL)
```sql
-- 1. Find pending purchase
SELECT * FROM package_purchases WHERE status = 'pending';

-- 2. Get admin ID
SELECT id FROM users WHERE is_admin = true LIMIT 1;

-- 3. Approve purchase
SELECT approve_dp20_purchase(
  '<purchase-id>'::UUID,
  '<admin-id>'::UUID,
  'Test approval'
);

-- 4. Verify user has DP20
SELECT email, dp20_balance, dp20_expiry
FROM users
WHERE id = '<user-id>';
```

### User Can See DP20 Balance
- [ ] Check dashboard shows DP20: 20 visits remaining
- [ ] User can book Day Pass with DP20 payment method

## Security Considerations

1. **RLS Policies**: Enforce at database level
   - Users can only see/create their own purchases
   - Admins have full access

2. **Receipt Storage**: Private bucket
   - Only signed URLs accessible
   - URLs expire after set time

3. **Admin Actions**:
   - All approvals/rejections logged with admin ID
   - Timestamp recorded

4. **Database Functions**: `SECURITY DEFINER`
   - Ensures proper permissions
   - Prevents privilege escalation

## Summary

✅ **Database Layer**: Complete
✅ **Service Layer**: Complete
✅ **User Flow**: Complete
⚠️ **Admin UI**: Needs implementation

The backend is fully functional and tested via SQL. The missing piece is the admin UI to approve/reject purchases within the web app instead of manually via SQL.
