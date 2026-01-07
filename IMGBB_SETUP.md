# ImgBB Setup - Free Image Hosting

Since Firebase Storage requires a billing plan upgrade, we've switched to **ImgBB** - a completely free image hosting service.

## Quick Setup (2 minutes)

### 1. Get Free ImgBB API Key

1. Go to: https://api.imgbb.com/
2. Scroll down to "Get your API key" section
3. Enter your email address
4. Check your email for the API key (comes immediately)

### 2. Add API Key to Environment Variables

**Option A: If using `.env.local` (recommended for local development)**

Create or edit `.env.local` in your project root:

```env
NEXT_PUBLIC_IMGBB_API_KEY=your_api_key_here
```

**Option B: If using Vercel (for production)**

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add new variable:
   - Name: `NEXT_PUBLIC_IMGBB_API_KEY`
   - Value: Your ImgBB API key
   - Environment: Production, Preview, Development (check all)

### 3. Restart Development Server

If running locally, restart your dev server:

```bash
npm run dev
```

### 4. Test Upload

Try uploading an image to your blog - it should work now!

---

## ImgBB Benefits

- ✅ **Completely free** - No credit card required
- ✅ **No billing setup** - Unlike Firebase Storage
- ✅ **1MB+ images supported** - No Firestore limit
- ✅ **Fast CDN** - Images load quickly
- ✅ **Simple API** - Easy to use

**Free Tier Limits:**
- Unlimited uploads
- Images stored permanently (unless deleted)
- 32MB max file size per image

---

## Troubleshooting

### Error: "ImgBB API key not found"

**Solution:**
1. Make sure `.env.local` exists in project root
2. Make sure variable name is exactly: `NEXT_PUBLIC_IMGBB_API_KEY`
3. Restart dev server after adding env variable
4. For Vercel: Make sure env variable is set in dashboard

### Error: "ImgBB upload failed"

**Possible causes:**
1. Invalid API key - Double-check it's correct
2. Network error - Check internet connection
3. File too large - ImgBB limit is 32MB, but we compress to 500KB

**Solution:**
- Verify API key at https://api.imgbb.com/
- Check browser console for specific error
- Try uploading a smaller image

---

## How It Works

1. User uploads image in blog admin
2. Image is compressed to max 500KB (via `browser-image-compression`)
3. Image is uploaded to ImgBB via API
4. ImgBB returns a public URL (e.g., `https://i.ibb.co/...`)
5. URL is stored in Firestore (just the URL, not the image data)
6. Images display from ImgBB CDN

**No more Firestore 1MB limit errors!** ✅

---

## Migration Notes

If you have existing blog posts with base64 images, you can migrate them later using the migration script (when you want to).

For now, new uploads will use ImgBB automatically.

---

## Future: Firebase Storage

If you want to use Firebase Storage later:

1. Upgrade Firebase project billing plan (Blaze plan)
2. Enable Storage in Firebase Console
3. Update `blogService.ts` to use `uploadImageToStorage` instead of `uploadImageToImgBB`
4. Deploy Storage security rules

For now, ImgBB works perfectly and is completely free!

