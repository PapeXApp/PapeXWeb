> **OUTDATED (as of 2026-09-16):** These steps describe switching from a base64 default to Vercel Blob, but the project ended up on a third provider instead. `lib/storageConfig.ts` on main has set `STORAGE_PROVIDER = 'imgbb'` since 2026-01-14 (commit 863e542) — that is the actual current default, not what this doc says.

# Enable Vercel Blob Storage

## Quick Setup (2 steps)

### Step 1: Set Environment Variable

**Option A: Vercel Dashboard (Recommended for Production)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `NEXT_PUBLIC_STORAGE_PROVIDER`
   - **Value**: `vercel`
   - **Environment**: Production, Preview, Development (select all)
5. Click **Save**

**Option B: Local Development (.env.local)**
1. Create/update `.env.local` in the `PapeXWeb` folder:
   ```bash
   NEXT_PUBLIC_STORAGE_PROVIDER=vercel
   ```
2. Restart your dev server

### Step 2: Verify BLOB_READ_WRITE_TOKEN

Vercel automatically provides `BLOB_READ_WRITE_TOKEN` for projects deployed on Vercel.

**For Local Development:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Copy the `BLOB_READ_WRITE_TOKEN` value
3. Add it to your `.env.local`:
   ```bash
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

**For Production:**
- Vercel automatically injects this token - no action needed!

---

## That's It! ✅

1. **Redeploy** (if using Vercel Dashboard) or **restart dev server** (if using .env.local)
2. **Create a new blog post** with an image
3. **Check the console** - you should see: `Storage provider: vercel`
4. **Verify** the image URL starts with `https://*.blob.vercel-storage.com/`

---

## Testing

1. Create a new blog post
2. Upload an image
3. Check the browser console - should see: `Uploading image to Vercel Blob Storage...`
4. Check Firestore - `image` field should be a Vercel Blob URL
5. Verify image displays correctly on the blog page

---

## Troubleshooting

### "BLOB_READ_WRITE_TOKEN not found"
- **Local dev**: Add token to `.env.local`
- **Production**: Check Vercel Dashboard → Environment Variables
- **Note**: Token is auto-provided for Vercel projects, but you may need to add it manually for local dev

### "Storage provider: base64" (not using Vercel)
- Check environment variable is set correctly
- Restart dev server after changing `.env.local`
- Redeploy if using Vercel Dashboard

### Images not uploading
- Check browser console for errors
- Verify API route is accessible: `/api/upload-image`
- Check Vercel function logs in dashboard

---

## Benefits You'll Get

✅ **CDN Delivery** - Images served from global CDN  
✅ **Better Performance** - Faster image loading  
✅ **Free Tier** - 1GB storage, 100GB bandwidth/month  
✅ **Automatic Optimization** - Images compressed before upload  
✅ **Scalable** - Easy to upgrade if needed  

---

## Current Status

After setting the environment variable:
- ✅ New blog posts → Upload to Vercel Blob
- ✅ Existing images → Continue to work (backward compatible)
- ✅ Image compression → Automatic (< 500KB, 1920px max)
- ✅ CDN delivery → Automatic

**You're all set!** 🚀

