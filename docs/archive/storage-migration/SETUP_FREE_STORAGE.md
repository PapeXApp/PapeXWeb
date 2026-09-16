> **OUTDATED (as of 2026-09-16):** This doc's premise (base64 is the configured default) is stale. `lib/storageConfig.ts` on main has set `STORAGE_PROVIDER = 'imgbb'` since 2026-01-14 (commit 863e542) — that is the actual current default, not what this doc says.

# Setup Guide: Free Image Storage Options

Choose one of these **100% free** options for blog images:

---

## Option 1: Optimized Base64 (Recommended for Zero Setup) ⚡

**Pros:**
- ✅ **Zero setup** - Works immediately
- ✅ **100% free** - No external services
- ✅ **No API keys** needed
- ✅ **No rate limits**

**Cons:**
- ⚠️ Larger Firestore documents
- ⚠️ No CDN benefits

**Setup:**
1. No setup needed! It's already configured as the default.

**How it works:**
- Images are compressed to < 200KB
- Stored as base64 in Firestore
- All existing images continue to work

---

## Option 2: Vercel Blob Storage (Recommended for Best Performance) 🚀

**Pros:**
- ✅ **Free tier**: 1GB storage, 100GB bandwidth/month
- ✅ **CDN included** - Fast global delivery
- ✅ **Native Next.js integration**
- ✅ **No CORS issues**

**Setup:**

1. **Install Vercel Blob:**
   ```bash
   npm install @vercel/blob
   ```

2. **Get Vercel Blob token:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `BLOB_READ_WRITE_TOKEN` (Vercel auto-generates this for you)
   - Or go to: https://vercel.com/docs/storage/vercel-blob/quickstart

3. **Set environment variable:**
   ```bash
   # In .env.local or Vercel dashboard
   NEXT_PUBLIC_STORAGE_PROVIDER=vercel
   ```

4. **Update blogService:**
   - The code is already ready! Just switch the import in your components.

**That's it!** New uploads will use Vercel Blob automatically.

---

## Option 3: ImgBB API (Completely Free, No Limits) 🎁

**Pros:**
- ✅ **100% free** - No limits mentioned
- ✅ **Simple API**
- ✅ **Direct image URLs**

**Cons:**
- ⚠️ Requires API key (free, 2 min setup)
- ⚠️ No official SLA

**Setup:**

1. **Get free API key:**
   - Go to: https://api.imgbb.com/
   - Click "Get API Key"
   - Sign up (free, takes 2 minutes)
   - Copy your API key

2. **Set environment variable:**
   ```bash
   # In .env.local or Vercel dashboard
   NEXT_PUBLIC_STORAGE_PROVIDER=imgbb
   NEXT_PUBLIC_IMGBB_API_KEY=your_api_key_here
   ```

3. **That's it!** New uploads will use ImgBB automatically.

---

## How to Switch Storage Providers

### Method 1: Environment Variable (Recommended)

Create/update `.env.local`:
```bash
# For Vercel Blob
NEXT_PUBLIC_STORAGE_PROVIDER=vercel

# OR for ImgBB
NEXT_PUBLIC_STORAGE_PROVIDER=imgbb
NEXT_PUBLIC_IMGBB_API_KEY=your_key_here

# OR for Base64 (default, no env var needed)
# NEXT_PUBLIC_STORAGE_PROVIDER=base64
```

### Method 2: Update Code Directly

Edit `lib/storageConfig.ts`:
```typescript
export const STORAGE_PROVIDER: StorageProvider = 'vercel' // or 'imgbb' or 'base64'
```

### Method 3: Update blogService Import

In your components, change:
```typescript
// From:
import { blogService } from '@/lib/blogService'

// To:
import { blogService } from '@/lib/blogServiceFree'
```

---

## Migration Between Providers

All providers are backward compatible:
- ✅ Existing base64 images continue to work
- ✅ Existing URLs continue to work
- ✅ New uploads use the selected provider
- ✅ No need to migrate existing images

---

## Comparison

| Feature | Base64 | Vercel Blob | ImgBB |
|---------|--------|-------------|-------|
| **Setup Time** | 0 min | 5 min | 2 min |
| **Free Tier** | Unlimited | 1GB/100GB | Unlimited* |
| **CDN** | ❌ | ✅ | ✅ |
| **API Key** | ❌ | ✅ (auto) | ✅ (manual) |
| **Performance** | Good | Excellent | Good |
| **Reliability** | High | High | Medium |

*ImgBB doesn't specify limits but is free

---

## Recommendation

**Start with Base64** (already working, zero setup)
- If you have < 50 blog posts, this is perfect
- Images are compressed to < 200KB each
- Total Firestore usage: ~10MB for 50 posts

**Upgrade to Vercel Blob** when:
- You have many blog posts (> 50)
- You want better performance
- You want CDN benefits

---

## Troubleshooting

### Vercel Blob: "BLOB_READ_WRITE_TOKEN not found"
- Check Vercel dashboard → Settings → Environment Variables
- Ensure token is set in production environment
- Redeploy after adding environment variable

### ImgBB: "API key not found"
- Check `.env.local` has `NEXT_PUBLIC_IMGBB_API_KEY`
- Verify API key is correct
- Check ImgBB dashboard for key status

### Base64: "Document too large"
- Images are already compressed to < 200KB
- If still too large, switch to Vercel Blob or ImgBB

---

## Next Steps

1. **Choose your provider** (Base64 is already working!)
2. **Set environment variable** (if using Vercel/ImgBB)
3. **Test upload** - Create a new blog post
4. **Done!** 🎉

