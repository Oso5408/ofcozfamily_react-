# Multi-Image Feature Setup Guide

## 🎯 Quick Setup Checklist

Complete these steps **in order** to enable the multi-image room feature:

- [ ] **Step 1**: Create storage bucket
- [ ] **Step 2**: Set up RLS policies
- [ ] **Step 3**: Run database migration
- [ ] **Step 4**: Verify setup
- [ ] **Step 5**: Test the feature

---

## 📋 Detailed Setup Instructions

### Step 1: Create Storage Bucket

**Go to**: Supabase Dashboard → Storage → Buckets

**Option A - Via UI (Easiest)**
1. Click **"New bucket"**
2. Name: `room-images`
3. Toggle **"Public bucket"** to ON
4. Click **"Create bucket"**

**Option B - Via SQL**
```sql
-- Run this in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;
```

✅ **Verify**: You should see a bucket named `room-images` in Storage → Buckets

---

### Step 2: Set Up RLS Policies

**Go to**: Supabase Dashboard → SQL Editor

**Copy and paste** the entire content of this file:
```
supabase/setup-room-images-policies.sql
```

**What this does:**
- ✅ Allows **public** to view/download room images
- ✅ Allows **admin users** to upload room images
- ✅ Allows **admin users** to update room images
- ✅ Allows **admin users** to delete room images

**Admin verification**: Uses `public.users.is_admin` field to check admin status

✅ **Verify**: The query at the end of the script will show the created policies:
```
- Public can view room images (SELECT)
- Admins can upload room images (INSERT)
- Admins can update room images (UPDATE)
- Admins can delete room images (DELETE)
```

---

### Step 3: Run Database Migration

**Go to**: Supabase Dashboard → SQL Editor

**Copy and paste** the entire content of this file:
```
supabase/migrations/add-room-images-array.sql
```

**What this migration does:**
1. ✅ Adds `images` JSONB column to `rooms` table
2. ✅ Migrates existing `image_url` to new `images` array format
3. ✅ Creates trigger to auto-sync `image_url` with first visible image
4. ✅ Maintains backward compatibility

**Structure of images array:**
```json
[
  {"url": "https://...", "visible": true, "order": 1},
  {"url": "https://...", "visible": false, "order": 2},
  {"url": "https://...", "visible": true, "order": 3}
]
```

✅ **Verify**: Run this query to check the column exists:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rooms' AND column_name = 'images';

-- Expected result:
-- column_name | data_type
-- images      | jsonb
```

---

### Step 4: Verify Setup is Complete

Run these verification queries in Supabase SQL Editor:

**A. Check storage bucket exists:**
```sql
SELECT * FROM storage.buckets WHERE id = 'room-images';
-- Should return 1 row with id='room-images' and public=true
```

**B. Check RLS policies exist:**
```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
AND policyname LIKE '%room images%';

-- Should return 4 policies:
-- 1. Public can view room images (SELECT)
-- 2. Admins can upload room images (INSERT)
-- 3. Admins can update room images (UPDATE)
-- 4. Admins can delete room images (DELETE)
```

**C. Check images column exists:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'rooms' AND column_name = 'images';

-- Should return:
-- column_name: images
-- data_type: jsonb
-- column_default: '[]'::jsonb
```

**D. Check trigger exists:**
```sql
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'rooms'
AND trigger_name = 'sync_room_image_url_trigger';

-- Should return:
-- sync_room_image_url_trigger | INSERT
-- sync_room_image_url_trigger | UPDATE
```

**E. Check existing rooms were migrated:**
```sql
SELECT id, name, image_url, images
FROM public.rooms
LIMIT 3;

-- Should show:
-- - Existing image_url values
-- - images array with at least one entry if image_url was not null
```

---

### Step 5: Test the Feature

**As Admin User:**

1. **Log in** to your app as an admin user

2. **Go to Admin Panel** → Rooms tab

3. **Click "Edit Room"** on any room

4. **Upload Images**:
   - Click or drag 1-3 images
   - Each image will open cropper
   - Crop and confirm each image

5. **Test Image Controls**:
   - ⬅️➡️ **Reorder**: Click arrows to change order
   - 👁️ **Visibility**: Click eye icon to show/hide
   - ❌ **Remove**: Click X to delete image
   - Check order badges (#1, #2, #3)

6. **Save Changes**

7. **View on Rooms Page**:
   - Go to the public Rooms page
   - Find the room you edited
   - Verify carousel shows only visible images
   - Test navigation arrows (←→)
   - Click dots to jump between images

**Test Scenarios:**

✅ **Scenario 1**: Upload 1 image
- No carousel arrows should appear
- Just shows single image

✅ **Scenario 2**: Upload 3 images, all visible
- Carousel should show all 3 images
- Arrows and dots visible on hover
- Can navigate between all images

✅ **Scenario 3**: Upload 3 images, hide middle one
- Carousel should only show 2 images (1st and 3rd)
- Hidden image not visible to customers
- Order preserved (1st image, then 3rd)

✅ **Scenario 4**: Reorder images
- Change order using arrows
- Save and verify order changed on customer view

---

## 🔍 Troubleshooting

### Issue: Upload fails with "Access denied"

**Cause**: Storage policies not set up correctly

**Fix**:
1. Verify you're logged in as admin user
2. Check `users.is_admin` is `true` for your account:
   ```sql
   SELECT id, email, is_admin FROM public.users WHERE email = 'your@email.com';
   ```
3. If `is_admin` is false, update it:
   ```sql
   UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
   ```
4. Re-run the RLS policies script (`supabase/setup-room-images-policies.sql`)
5. Log out and log back in

### Issue: Images not showing in carousel

**Cause**: Images marked as `visible: false` or images array empty

**Fix**:
```sql
-- Check images array
SELECT id, name, images FROM public.rooms WHERE id = <room_id>;

-- Set all images visible for a room
UPDATE public.rooms
SET images = (
  SELECT jsonb_agg(
    jsonb_set(elem, '{visible}', 'true'::jsonb)
  )
  FROM jsonb_array_elements(images) AS elem
)
WHERE id = <room_id>;
```

### Issue: Old image_url not syncing

**Cause**: Trigger not firing or migration not run

**Fix**:
1. Verify trigger exists (see Step 4D above)
2. Manually sync image_url:
   ```sql
   UPDATE public.rooms
   SET images = images; -- This will fire the trigger
   ```

### Issue: Bucket doesn't exist

**Cause**: Storage bucket not created

**Fix**:
```sql
-- Create bucket via SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true)
ON CONFLICT (id) DO NOTHING;
```

---

## 🎉 Success Criteria

You'll know everything is working when:

✅ Admin can upload 1-3 images per room
✅ Admin can toggle visibility for each image
✅ Admin can reorder images using arrows
✅ Admin can remove images
✅ Customers see carousel with navigation
✅ Customers only see visible images
✅ Images display in correct order
✅ Backward compatibility maintained (old rooms with single image_url still work)

---

## 📚 Related Documentation

- Full feature documentation: `MULTI-IMAGE-IMPLEMENTATION.md`
- Database migration script: `supabase/migrations/add-room-images-array.sql`
- Storage setup script: `supabase/setup-room-images-storage.sql`
- RLS policies script: `supabase/setup-room-images-policies.sql`

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Verify admin status: `SELECT is_admin FROM users WHERE email = 'your@email.com'`
4. Verify bucket exists: `SELECT * FROM storage.buckets WHERE id = 'room-images'`
5. Check storage policies: See Step 4B above

---

## ⚡ Quick Command Reference

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'room-images';

-- Check storage policies
SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%room images%';

-- Check images column
SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'images';

-- Check trigger
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'rooms' AND trigger_name LIKE '%sync%';

-- View room images
SELECT id, name, images FROM public.rooms;

-- Make user admin
UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
```

---

**Ready to proceed?** Start with Step 1 and work through each step in order. Let me know if you encounter any issues!
