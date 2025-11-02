# 🚀 Quick Start: Multi-Image Feature

## ⚡ 3-Minute Setup

### Prerequisites
✅ All code is already implemented
✅ All dependencies are installed
✅ You have access to Supabase Dashboard

---

## 🎯 Setup (Just Run 1 SQL Script!)

### Option A: All-in-One Script (Easiest) ⭐

1. **Open Supabase Dashboard** → SQL Editor

2. **Copy & paste** the entire content of:
   ```
   supabase/SETUP-ALL-IN-ONE.sql
   ```

3. **Click "RUN"**

4. ✅ **Done!** Verify you see:
   - ✅ Storage bucket created
   - ✅ Images column added
   - ✅ Existing images migrated
   - ✅ Trigger created
   - ✅ RLS policies created

---

### Option B: Step-by-Step (More Control)

Run these scripts **in order**:

1. **Storage Setup**
   ```
   supabase/setup-room-images-storage.sql
   ```

2. **RLS Policies**
   ```
   supabase/setup-room-images-policies.sql
   ```

3. **Database Migration**
   ```
   supabase/migrations/add-room-images-array.sql
   ```

---

## 🧪 Test It!

### 1. Make yourself admin (if not already)

```sql
-- Run in Supabase SQL Editor
UPDATE public.users
SET is_admin = true
WHERE email = 'your@email.com';
```

### 2. Test the feature

1. **Login** to your app as admin
2. **Go to** Admin Panel → Rooms tab
3. **Click** "Edit Room"
4. **Upload** 1-3 images (drag & drop or click)
5. **Crop** each image
6. **Toggle** visibility with 👁️ icon
7. **Reorder** with ⬅️➡️ arrows
8. **Save** changes

### 3. View the carousel

1. **Go to** Rooms page (public view)
2. **Find** the room you edited
3. **See** carousel with navigation
4. **Hover** to see arrows
5. **Click** arrows or dots to navigate

---

## ✅ Success Checklist

After setup, verify:

- [ ] Storage bucket `room-images` exists in Supabase Storage
- [ ] Can upload images as admin
- [ ] Can toggle visibility (👁️)
- [ ] Can reorder images (⬅️➡️)
- [ ] Can remove images (❌)
- [ ] Carousel shows on Rooms page
- [ ] Only visible images appear
- [ ] Navigation arrows work
- [ ] Dot indicators work

---

## 🐛 Troubleshooting

### Upload fails with "Access denied"

**Fix**:
```sql
-- Make sure you're admin
SELECT is_admin FROM public.users WHERE email = 'your@email.com';

-- If false, run:
UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
```

Then **log out and log back in**.

### Images don't show in carousel

**Fix**:
```sql
-- Check if images exist
SELECT id, name, images FROM public.rooms WHERE id = 1;

-- If images are hidden, make them visible
UPDATE public.rooms
SET images = (
  SELECT jsonb_agg(
    jsonb_set(elem, '{visible}', 'true'::jsonb)
  )
  FROM jsonb_array_elements(images) AS elem
)
WHERE id = 1;
```

### Bucket doesn't exist

**Fix**: Re-run `supabase/SETUP-ALL-IN-ONE.sql`

---

## 📁 What Was Changed

### Files Created:
- ✅ `supabase/SETUP-ALL-IN-ONE.sql` - One-click setup script
- ✅ `supabase/migrations/add-room-images-array.sql` - Database migration
- ✅ `supabase/setup-room-images-storage.sql` - Storage bucket setup
- ✅ `supabase/setup-room-images-policies.sql` - RLS policies
- ✅ `SETUP-MULTI-IMAGE-FEATURE.md` - Detailed setup guide
- ✅ `MULTI-IMAGE-IMPLEMENTATION.md` - Complete documentation
- ✅ `QUICK-START-MULTI-IMAGE.md` - This file

### Files Modified:
- ✅ `src/components/admin/EditRoomModal.jsx` - Multi-image upload UI
- ✅ `src/services/roomService.js` - Multi-image functions
- ✅ `src/components/RoomsSection.jsx` - Carousel display

### Files Backed Up:
- ✅ `src/components/admin/EditRoomModal.jsx.backup` - Original version

---

## 🎨 Feature Overview

### Admin View
```
┌─────────────────────────────────────────┐
│  Edit Room - Room A                     │
├─────────────────────────────────────────┤
│  Room Images (2/3)                      │
│                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ IMG1 │  │ IMG2 │  │ [+]  │           │
│  │  #1  │  │  #2  │  │Upload│           │
│  │ ⬅️👁️❌➡️│  │ ⬅️👁️❌➡️│  │      │           │
│  └──────┘  └──────┘  └──────┘           │
│                                          │
│  [Cancel]              [Save]           │
└─────────────────────────────────────────┘
```

### Customer View
```
┌─────────────────────────────┐
│                             │
│   ←    [Room Image]    →    │
│                             │
│          ● ○ ○              │
└─────────────────────────────┘
```

---

## 📖 Documentation

- **Quick Start**: `QUICK-START-MULTI-IMAGE.md` (this file)
- **Setup Guide**: `SETUP-MULTI-IMAGE-FEATURE.md`
- **Full Docs**: `MULTI-IMAGE-IMPLEMENTATION.md`

---

## 🎉 You're Ready!

The code is complete. Just run the SQL setup script and start testing!

**Next**: Open Supabase Dashboard and run `supabase/SETUP-ALL-IN-ONE.sql`

🚀 **Let's go!**
