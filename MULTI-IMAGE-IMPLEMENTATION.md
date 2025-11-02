# Multi-Image Room Gallery Implementation

## Overview

This implementation adds support for up to **3 images per room** with admin controls for visibility and display order. Images are shown in a beautiful carousel on the rooms page with navigation arrows and dot indicators.

---

## Features

✅ **Upload up to 3 images** per room
✅ **Show/Hide toggle** for each image (👁️ icon)
✅ **Reorder images** with left/right arrows
✅ **Image cropping** before upload
✅ **Carousel display** on rooms page
✅ **Navigation dots** indicating current image
✅ **Smooth transitions** between images
✅ **Backward compatible** with existing single images

---

## Files Created/Modified

### Database Migration

**File:** `supabase/migrations/add-room-images-array.sql`

- Adds `images` JSONB column to `rooms` table
- Structure: `[{"url": "...", "visible": true, "order": 1}, ...]`
- Auto-syncs `image_url` with first visible image (backward compatibility)
- Trigger function maintains compatibility

### Admin Components

**File:** `src/components/admin/EditRoomModal.jsx` (Updated)

- Multi-image upload interface (max 3 images)
- Grid layout showing all uploaded images
- Per-image controls:
  - 👁️ **Visibility toggle** (show/hide to customers)
  - ⬅️➡️ **Reorder arrows**
  - ❌ **Remove button**
  - #️⃣ **Order badge**
  - 📐 **Crop function**
- Drag & drop support
- Real-time preview

**Backup:** `src/components/admin/EditRoomModal.jsx.backup` (Original)

### Services

**File:** `src/services/roomService.js` (Updated)

Added functions:
- `uploadRoomImage(roomId, file, index)` - Upload individual image
- `updateRoomImages(roomId, imagesData)` - Update all room images
- Renamed old function to `uploadRoomImageSingle()` for backward compatibility

### Frontend Display

**File:** `src/components/RoomsSection.jsx` (Updated)

- Image carousel with navigation
- Left/Right arrow buttons (show on hover)
- Dot indicators at bottom
- Click dot to jump to specific image
- Only shows visible images
- Respects admin-set order
- Smooth transitions

---

## How It Works

### Admin Upload Flow

```
1. Admin clicks "Edit Room" → Opens modal
   ↓
2. Admin uploads image (drag or click)
   ↓
3. Image cropper appears
   ↓
4. Admin crops and confirms
   ↓
5. Image appears in grid with controls
   ↓
6. Admin can:
   - Toggle visibility (👁️)
   - Reorder (⬅️➡️)
   - Remove (❌)
   - Upload more (max 3)
   ↓
7. Admin clicks "Save"
   ↓
8. Images uploaded to Supabase Storage
   ↓
9. Room record updated with images array
```

### Customer View Flow

```
1. Customer views Rooms page
   ↓
2. Only VISIBLE images shown in carousel
   ↓
3. Images displayed in ORDER set by admin
   ↓
4. If multiple images:
   - Hover shows navigation arrows
   - Dots show current position
   - Click arrows or dots to navigate
   ↓
5. If single image:
   - No navigation shown
   - Just displays the image
```

---

## Database Schema

### Before (Single Image)
```sql
rooms (
  id INT,
  name TEXT,
  image_url TEXT,  -- Single image URL
  ...
)
```

### After (Multiple Images)
```sql
rooms (
  id INT,
  name TEXT,
  image_url TEXT,  -- Auto-synced to first visible image
  images JSONB,    -- NEW: Array of images
  ...
)
```

### Images Array Structure
```json
[
  {
    "url": "https://...storage.../room-1-0-1234567890.jpg",
    "visible": true,
    "order": 1
  },
  {
    "url": "https://...storage.../room-1-1-1234567891.jpg",
    "visible": false,
    "order": 2
  },
  {
    "url": "https://...storage.../room-1-2-1234567892.jpg",
    "visible": true,
    "order": 3
  }
]
```

---

## Setup Instructions

### Step 1: Run Database Migration

```bash
# In Supabase SQL Editor, run:
supabase/migrations/add-room-images-array.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify Migration

Check that the migration worked:
```sql
-- Should show new 'images' column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rooms' AND column_name = 'images';

-- Check trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'rooms'
AND trigger_name = 'sync_room_image_url_trigger';
```

### Step 3: Test the Feature

1. Log in as admin
2. Go to Admin Panel → Rooms tab
3. Click "Edit Room" on any room
4. Upload 1-3 images
5. Toggle visibility for each
6. Reorder using arrows
7. Click "Save"
8. View the room on the Rooms page
9. Test the carousel navigation

---

## Admin Interface

### Edit Room Modal Layout

```
┌─────────────────────────────────────────────────────┐
│  Edit Room - Room A                                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Room Images (2/3)                                   │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Image 1 │  │  Image 2 │  │   [+]    │           │
│  │          │  │          │  │  Upload  │           │
│  │  #1      │  │  #2      │  │   New    │           │
│  │  Visible │  │  Hidden  │  │          │           │
│  │          │  │          │  │          │           │
│  │ ⬅️ 👁️ ❌ ➡️ │  │ ⬅️ 👁️ ❌ ➡️│  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                       │
│  💡 Tip: Click eye icon to show/hide images          │
│                                                       │
│  [Cancel]               [Save]                       │
└─────────────────────────────────────────────────────┘
```

### Image Controls (on hover)

- **⬅️ Left Arrow**: Move image left in order
- **👁️ Eye Icon**: Toggle visibility (green=visible, gray=hidden)
- **❌ X Button**: Remove image
- **➡️ Right Arrow**: Move image right in order

### Status Badges

- **#1, #2, #3**: Display order
- **Visible** (green): Shown to customers
- **Hidden** (gray): Not shown to customers

---

## Customer Interface

### Carousel on Rooms Page

```
┌─────────────────────────────────┐
│                                 │
│     ←    [Room Image]    →      │
│                                 │
│            ● ○ ○                │
└─────────────────────────────────┘
```

### Features

- **Left/Right Arrows**: Navigate between images (show on hover)
- **Dot Indicators**: Show current image position
- **Click Dot**: Jump to specific image
- **Smooth Transitions**: Fade between images
- **Auto-hide**: Arrows hidden if only 1 image

---

## API Reference

### roomService.uploadRoomImage()

Upload a single image for a room.

```javascript
const result = await roomService.uploadRoomImage(roomId, file, index);
// Returns: { success: boolean, url?: string, error?: string }
```

**Parameters:**
- `roomId` (number): Room ID
- `file` (File): Image file object
- `index` (number): Image index (0-2)

**Returns:**
- `success`: Whether upload succeeded
- `url`: Public URL of uploaded image
- `error`: Error message if failed

### roomService.updateRoomImages()

Update all images for a room.

```javascript
const imagesData = [
  { url: "https://...", visible: true, order: 1 },
  { url: "https://...", visible: false, order: 2 },
];
const result = await roomService.updateRoomImages(roomId, imagesData);
// Returns: { success: boolean, room?: object, error?: string }
```

**Parameters:**
- `roomId` (number): Room ID
- `imagesData` (Array): Array of image objects

**Returns:**
- `success`: Whether update succeeded
- `room`: Updated room object
- `error`: Error message if failed

---

## Backward Compatibility

### Existing Rooms

- Rooms with `image_url` only: Automatically migrated to `images` array
- Still works with old `image_url` field
- `image_url` auto-syncs to first visible image
- No manual migration needed

### Old Code

- Components still using `room.image_url` will work
- New components use `room.images` array
- Fallback to `image_url` if `images` is empty

---

## Troubleshooting

### Images not showing in carousel

**Check:**
1. Are images marked as `visible: true`?
2. Are images uploaded successfully?
3. Check browser console for errors
4. Verify `images` array in database

**Fix:**
```sql
-- Check room images
SELECT id, name, images FROM rooms WHERE id = 1;

-- Set all images visible
UPDATE rooms SET images = jsonb_set(
  images,
  '{0,visible}',
  'true'::jsonb
) WHERE id = 1;
```

### Upload fails

**Check:**
1. File size < 5MB?
2. File type is JPG/PNG/WebP?
3. User is admin?
4. Storage bucket exists?

**Fix:**
```bash
# Check Supabase Storage
# Go to Storage → room-images bucket
# Verify policies allow upload
```

### Carousel not working

**Check:**
1. Multiple visible images exist?
2. JavaScript errors in console?
3. Images array properly formatted?

**Fix:**
- Clear browser cache
- Check `visibleImages` array in component
- Verify image URLs are valid

---

## Best Practices

### For Admins

✅ Upload high-quality images (1200x900px or larger)
✅ Use consistent aspect ratio (4:3 recommended)
✅ Show most important image first (order: 1)
✅ Hide low-quality or redundant images
✅ Keep filenames descriptive
✅ Test carousel before publishing

❌ Don't upload huge files (>2MB each)
❌ Don't mix portrait and landscape
❌ Don't leave all images hidden
❌ Don't upload blurry photos

### For Developers

✅ Always check `visible` flag
✅ Sort by `order` field
✅ Handle empty `images` array
✅ Fallback to `image_url`
✅ Validate image URLs
✅ Test with 0, 1, 2, and 3 images

❌ Don't assume images exist
❌ Don't ignore order field
❌ Don't hardcode image count

---

## Performance Considerations

### Image Loading

- Images lazy-loaded by browser
- Only visible images downloaded
- Smooth transitions (CSS only)
- No heavy JavaScript

### Storage

- Each image ~200-500KB (after compression)
- Max 1.5MB per room (3 images × 500KB)
- Supabase CDN caching enabled
- Fast global delivery

---

## Future Enhancements

Possible improvements:

- [ ] **Auto-play carousel** (optional setting)
- [ ] **Zoom on click** (lightbox view)
- [ ] **Bulk upload** (upload 3 at once)
- [ ] **Image editing** (brightness, contrast)
- [ ] **Alt text** for accessibility
- [ ] **Image optimization** (automatic compression)
- [ ] **Drag to reorder** in admin
- [ ] **Mobile swipe** gestures

---

## Migration Checklist

Before deploying:

- [ ] Run database migration
- [ ] Test admin upload (1-3 images)
- [ ] Test visibility toggle
- [ ] Test reorder function
- [ ] Test remove function
- [ ] Test carousel navigation
- [ ] Test with existing rooms
- [ ] Test on mobile devices
- [ ] Backup existing images
- [ ] Update admin documentation

---

## Support

### Common Issues

**Q: Can I upload more than 3 images?**
A: No, limit is 3 images per room. This ensures fast page load times.

**Q: What happens to my old images?**
A: They're automatically migrated to the new `images` array. Nothing lost!

**Q: Can customers see hidden images?**
A: No, only images with `visible: true` are shown.

**Q: How do I change image order?**
A: Use the left/right arrow buttons in the admin modal.

**Q: Can I delete all images?**
A: Yes, but at least one image is recommended for best presentation.

---

## Summary

✨ **The multi-image feature is complete and ready to use!**

**Key Points:**
- Upload up to 3 images per room
- Control visibility for each image
- Reorder images with arrows
- Beautiful carousel display for customers
- Fully backward compatible
- Admin-friendly interface

**Next Steps:**
1. Run the database migration
2. Test uploading images as admin
3. View the carousel on the rooms page
4. Enjoy the enhanced room gallery! 🎉
