# Video Upload Instructions

Since YouTube embedding is having issues, you can host the video yourself using Supabase Storage.

## Step 1: Set Up Storage Bucket

Run this SQL in your Supabase dashboard:

```bash
supabase db execute --file supabase/setup-video-storage.sql
```

Or manually in the SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste content from `supabase/setup-video-storage.sql`
3. Click "Run"

## Step 2: Upload Your Video

### Option A: Via Supabase Dashboard (Easiest)
1. Go to Supabase Dashboard → Storage
2. Find the `videos` bucket (it should be created)
3. Click "Upload file"
4. Upload your video file (e.g., `hero-video.mp4`)
5. After upload, click on the file and copy the public URL

### Option B: Via CLI
```bash
# Upload video file
supabase storage cp /path/to/your/video.mp4 videos/hero-video.mp4
```

## Step 3: Update HeroSection Component

After uploading, you'll get a URL like:
```
https://[your-project-ref].supabase.co/storage/v1/object/public/videos/hero-video.mp4
```

Replace the iframe in `src/components/HeroSection.jsx` with an HTML5 video player:

```jsx
<video
  className="w-full h-full object-cover rounded-xl"
  controls
  autoPlay
  muted
  loop
  playsInline
>
  <source
    src="https://[your-project-ref].supabase.co/storage/v1/object/public/videos/hero-video.mp4"
    type="video/mp4"
  />
  Your browser does not support the video tag.
</video>
```

## Alternative Option: Use Public Folder

If you want to keep the video in your project:

1. Create a `public/videos/` folder
2. Place your video file there (e.g., `public/videos/hero-video.mp4`)
3. Update HeroSection.jsx:

```jsx
<video
  className="w-full h-full object-cover rounded-xl"
  controls
  autoPlay
  muted
  loop
  playsInline
>
  <source src="/videos/hero-video.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>
```

**Note:** This will increase your build size. Recommended max size: 10-20MB

## Video Optimization Tips

Before uploading, compress your video:
- Use HandBrake or FFmpeg to reduce file size
- Recommended settings:
  - Resolution: 1280x720 (720p) or 1920x1080 (1080p)
  - Bitrate: 2-5 Mbps
  - Format: MP4 (H.264 codec)
  - Target size: < 20MB for good loading speed

## Testing

After implementing, test:
1. Video loads and plays
2. Controls work (play/pause/volume)
3. Autoplay works on mute
4. Video loops correctly
5. Mobile responsive
