# Debugging "Generation failed" / "fetch failed" Error

## Quick Checklist

1. **Check Convex Dashboard Logs**
   - Go to your Convex dashboard → Functions → Actions
   - Look for `batchGenerate.generateSingle` logs
   - Check for error messages with details about the fetch failure

2. **Verify PIPELINE_URL is Set**
   - Go to Convex Dashboard → Settings → Environment Variables
   - Ensure `PIPELINE_URL` is set to your Python backend URL
   - Format: `https://your-service.onrender.com` (no trailing slash)
   - If not set, Convex will try `http://localhost:8000` which won't work in production

3. **Check Python Backend is Running**
   - Verify your Render service is deployed and running
   - Test the health endpoint: `curl https://your-service.onrender.com/health`
   - Should return: `{"status":"ok"}`

4. **Check Error Details in UI**
   - When generation fails, check the error message in the modal
   - The error should now show more details like:
     - The URL being called
     - HTTP status codes
     - Network error messages

## Common Issues

### Issue 1: PIPELINE_URL Not Set
**Symptom:** Error shows `http://localhost:8000` in logs
**Fix:** Set `PIPELINE_URL` in Convex Dashboard environment variables

### Issue 2: Python Backend Not Accessible
**Symptom:** Error like "Fetch failed: Network error" or "ECONNREFUSED"
**Fix:** 
- Check Render service is running
- Verify the URL is correct (no trailing slash)
- Check if Render service is sleeping (free tier sleeps after inactivity)

### Issue 3: CORS Issues
**Symptom:** Error like "CORS policy" or "Access-Control-Allow-Origin"
**Fix:** The Python backend already has CORS middleware, but verify it's working

### Issue 4: Wrong Endpoint URL
**Symptom:** 404 errors
**Fix:** Ensure PIPELINE_URL doesn't have a trailing slash and points to root

## Testing Steps

1. **Test Python Backend Locally:**
```bash
cd backend-project-3d
python app.py
# In another terminal:
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

2. **Test Generation Endpoint:**
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","image_model":"nanobanana","three_d_model":"trellis"}'
```

3. **Check Convex Logs:**
   - After triggering a generation, check Convex dashboard logs
   - Look for the console.log messages showing the URL being called
   - Check the error message for details

## Next Steps After Error

1. Check the error message in the generation modal (it now shows more details)
2. Check Convex dashboard logs for the full error stack
3. Verify PIPELINE_URL is set correctly
4. Test the Python backend endpoints directly
5. Check Render service logs for any errors

