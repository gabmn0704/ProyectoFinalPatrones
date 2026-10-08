# EpiSafe AI - Troubleshooting & Frequently Asked Questions

## Table of Contents

1. [Common Issues](#common-issues)
2. [Frontend Troubleshooting](#frontend-troubleshooting)
3. [Backend/Database Troubleshooting](#backenddatabase-troubleshooting)
4. [Authentication Issues](#authentication-issues)
5. [Deployment Issues](#deployment-issues)
6. [FAQ](#faq)
7. [Getting Help](#getting-help)

---

## Common Issues

### Issue: "Cannot connect to Supabase"

**Symptoms**:
- Data won't load
- Login fails
- Errors like "Failed to connect to database"

**Solutions**:

1. **Check environment variables**
   ```bash
   # Verify .env.local in frontend folder
   cat frontend/.env.local
   # Should have:
   # VITE_SUPABASE_URL=https://devtfvejnrtphnlymrmq.supabase.co
   # VITE_SUPABASE_ANON_KEY=your_key_here
   ```

2. **Verify Supabase is running**
   - Go to: https://supabase.com/dashboard
   - Check project status: Should be green ✅
   - Check database status: Should be "Available"

3. **Check network connectivity**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to load data
   - Look for failed requests to `supabase.co`
   - Check browser console for CORS errors

4. **Verify Netlify environment**
   - Go to: https://app.netlify.com/sites/episafe-ai-gabmn0704/settings
   - Click "Build & deploy" → "Environment"
   - Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

**Still not working?**
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R
- Try in incognito mode
- Contact Supabase support if Supabase project is down

---

### Issue: "401 Unauthorized" or "Invalid Token"

**Symptoms**:
- Error when trying to access data
- Login appears successful but then errors
- Gets logged out unexpectedly

**Solutions**:

1. **Token has expired**
   ```typescript
   // The fix is automatic - Supabase auto-refreshes tokens
   // But if manual refresh needed:
   const { data, error } = await supabase.auth.refreshSession();
   ```
   - Try logging out and logging back in
   - Clear local storage: `localStorage.clear()`

2. **Verify token in request**
   - Open DevTools → Network tab
   - Click on failed request
   - Check "Authorization" header
   - Should show: `Authorization: Bearer eyJhbG...`

3. **Check RLS policies**
   - Go to Supabase dashboard
   - Click "Authentication" → "Policies"
   - Verify policies enable your user
   - If user is from Google OAuth, check Google OAuth is configured

**Still not working?**
- Log out completely
- Clear all cookies and local storage
- Log in again with fresh credentials

---

### Issue: "RLS Policy Violation"

**Error Message**:
```
new row violates row-level security policy
```

**Cause**: Your RLS policy isn't allowing the operation

**Solutions**:

1. **Check your user ID**
   ```typescript
   // In browser console
   const { data: user } = await supabase.auth.getUser();
   console.log(user.id);  // Should print your user UUID
   ```

2. **Verify policy allows operation**
   - Go to Supabase dashboard
   - Click table → "RLS Policies"
   - Verify policy has your user's operations:
     - SELECT (read data)
     - INSERT (create data)
     - UPDATE (modify data)
     - DELETE (remove data)

3. **Check data belongs to you**
   ```typescript
   // When saving data, ensure user_id matches:
   const { data, error } = await supabase
     .from('daily_logs')
     .insert({
       user_id: currentUser.id,  // MUST match logged-in user
       date: today,
       // ... other fields
     });
   ```

4. **If using Google OAuth**
   - Google OAuth creates new user_id
   - Old email account has different user_id
   - Need to use correct account consistently

**Still not working?**
- Check Supabase logs for detailed error
- Contact support with user_id and policy details

---

## Frontend Troubleshooting

### Issue: Page doesn't load or shows blank screen

**Solutions**:

1. **Check browser console for errors**
   - Press F12
   - Click Console tab
   - Look for red error messages
   - Note exact error and search Google

2. **Check network requests**
   - Press F12
   - Click Network tab
   - Refresh page
   - Look for failed requests (red)
   - Check if Supabase returns errors

3. **Clear browser cache**
   ```bash
   # Option 1: In browser
   # Press Ctrl+Shift+Delete
   # Select "Cached images and files"
   # Click "Clear"
   
   # Option 2: Hard refresh
   # Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   ```

4. **Check if Netlify deployment working**
   ```bash
   curl https://episafe-ai-gabmn0704.netlify.app
   # Should return HTML, not error
   ```

5. **Try different browser**
   - Chrome, Firefox, Safari all work?
   - If only one browser fails, it's a browser issue
   - Try incognito/private mode

---

### Issue: Dark mode not working or persisting

**Symptoms**:
- Dark mode toggle doesn't switch theme
- Theme resets on page reload
- Colors wrong in dark mode

**Solutions**:

1. **Check localStorage is enabled**
   ```javascript
   // In browser console
   localStorage.setItem('theme-test', 'true');
   console.log(localStorage.getItem('theme-test'));  // Should print 'true'
   localStorage.removeItem('theme-test');
   ```

2. **Check theme CSS is loaded**
   ```javascript
   // In browser console
   const root = document.documentElement;
   console.log(root.getAttribute('data-theme'));
   // Should print 'light' or 'dark'
   ```

3. **Force theme reset**
   ```javascript
   // In browser console
   localStorage.setItem('theme', 'light');
   location.reload();
   ```

4. **Check CSS variables are defined**
   ```javascript
   // In browser console
   const style = getComputedStyle(document.documentElement);
   console.log(style.getPropertyValue('--ink'));
   // Should print color value like: rgb(37, 43, 57)
   ```

---

### Issue: Form validation not working

**Symptoms**:
- Can submit invalid data
- Error messages don't show
- Can't figure out what's wrong

**Solutions**:

1. **Check validation logic**
   - Look at form component in code
   - Find `validators` object
   - Verify rules match your input

2. **Test validation manually**
   ```javascript
   // Example: test email validation
   const email = "invalid-email";
   const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
   console.log(isValid);  // Should be false
   ```

3. **Check error state shows**
   ```javascript
   // Make sure state is updated when error occurs
   const [error, setError] = useState("");
   // Should update when validation fails
   ```

4. **Verify submit handler catches errors**
   - Try submitting invalid data
   - Check browser console for errors
   - Ensure error message displays to user

---

## Backend/Database Troubleshooting

### Issue: Data not saving to database

**Symptoms**:
- Submit form, no error, but data doesn't appear
- Can't see data in Supabase dashboard
- Page shows success but database is empty

**Solutions**:

1. **Check Supabase database has data**
   - Go to: https://supabase.com/dashboard
   - Click on project
   - Click "SQL Editor"
   - Run: `SELECT * FROM daily_logs;`
   - See if any rows exist

2. **Check Supabase logs**
   - Go to: Supabase dashboard → "Logs"
   - Filter by errors
   - Look for database errors
   - Note error details

3. **Verify API request sent**
   ```javascript
   // Add logging to your save function
   const saveLog = async (data) => {
     console.log("Saving data:", data);  // Log what we're sending
     const { data: result, error } = await supabase
       .from('daily_logs')
       .insert([data]);
     console.log("Result:", result);
     console.log("Error:", error);  // Log any errors
     return result;
   };
   ```

4. **Check RLS allows INSERT**
   - Go to Supabase → Table → RLS Policies
   - Find your table
   - Check INSERT policy exists
   - Verify it allows your user

5. **Verify data structure matches schema**
   ```typescript
   // Data must match table columns exactly
   const data = {
     user_id: currentUser.id,  // Must match table column name
     date: "2024-01-15",       // Must be YYYY-MM-DD format
     sleep_hours: 7.5,          // Must be number
     stress_level: 5,           // Must be number
     // ... all required fields
   };
   ```

---

### Issue: Database query returns error

**Error**: `"column does not exist"` or `"table does not exist"`

**Solutions**:

1. **Check table name spelling**
   ```sql
   -- List all tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. **Check column name spelling**
   ```sql
   -- List all columns in a table
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'daily_logs';
   ```

3. **Check schema is initialized**
   - Go to Supabase → SQL Editor
   - Run the schema.sql file again:
   ```sql
   -- Run the full schema from backend/supabase/schema.sql
   -- Verify: "Success. No rows returned"
   ```

4. **Verify table has data**
   ```sql
   SELECT COUNT(*) FROM daily_logs;
   ```

---

### Issue: Performance is slow

**Symptoms**:
- Page loads slowly
- Database queries timeout
- Charts take forever to render

**Solutions**:

1. **Check database indexes**
   ```sql
   -- List indexes on a table
   SELECT * FROM pg_indexes 
   WHERE tablename = 'daily_logs';
   ```
   - Should have indexes on frequently filtered columns (user_id, date)

2. **Optimize query with filters**
   ```typescript
   // ❌ Bad: Load all data
   const { data } = await supabase
     .from('daily_logs')
     .select('*');  // Could be thousands of rows!

   // ✅ Good: Filter by date range
   const { data } = await supabase
     .from('daily_logs')
     .select('*')
     .gte('date', '2024-01-01')
     .lte('date', '2024-01-31');  // Only 30 days
   ```

3. **Check browser DevTools Performance**
   - Press F12 → Performance tab
   - Click record, interact with app, stop
   - Look for long red bars (slow operations)
   - Check what's taking time

4. **Monitor Netlify build time**
   - Go to: Netlify → Deploys
   - Check "Build duration"
   - If >5 min, optimize dependencies

---

## Authentication Issues

### Issue: "Email verification required"

**Symptoms**:
- Can't log in
- Email shows "Email not confirmed"
- Confirmation email stuck

**Solutions**:

1. **Check email for confirmation link**
   - Check spam/junk folder
   - Look for email from `no-reply@*supabase.co`
   - Click confirmation link within email

2. **Resend confirmation email**
   ```javascript
   // In Supabase dashboard:
   // Go to Authentication → Users
   // Find your user
   // Click ... → "Resend confirmation email"
   ```

3. **If email never arrived**
   - Check email is correct (no typo)
   - Check spam filters
   - Try different email address
   - Contact Supabase support

---

### Issue: "Google OAuth not working"

**Symptoms**:
- "Continue with Google" button doesn't work
- Click button, nothing happens
- Redirect back to login screen

**Solutions**:

1. **Verify OAuth is configured in Supabase**
   - Go to: Supabase → Authentication → Providers
   - Click "Google"
   - Check:
     - ✅ Enable Google Provider (toggle on)
     - ✅ Client ID filled in
     - ✅ Client Secret filled in
     - ✅ Redirect URL matches: `https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback`

2. **Check Google Cloud Console**
   - Go to: https://console.cloud.google.com
   - Project: "EpiSafe AI"
   - APIs → Credentials
   - OAuth 2.0 Client ID:
     - ✅ Type: Web application
     - ✅ Authorized redirect URIs: contains Supabase callback URL
     - ✅ Client ID and Secret still valid

3. **Check browser console for errors**
   - Press F12 → Console
   - Try to click "Continue with Google"
   - Look for error messages
   - Common error: `redirect_uri mismatch` (URL doesn't match exactly)

4. **Wait for propagation**
   - Google OAuth changes take 5-60 minutes to propagate
   - If just configured, wait and try again

5. **Check you're logged in to Google**
   - Open incognito window (no cookies)
   - Try Google OAuth again
   - May ask to pick or create Google account

---

### Issue: "Forgot password not working"

**Symptoms**:
- Can't reset password
- Reset link doesn't work
- Stuck at login screen

**Solutions**:

1. **Verify email address**
   - Double-check email entered is correct
   - Try with correct capitalization

2. **Check for reset email**
   - Check inbox and spam/junk
   - Look for email from `no-reply@*supabase.co`
   - Subject: "Reset your password"

3. **Reset password via Supabase dashboard**
   - Go to: Supabase → Authentication → Users
   - Find user by email
   - Click ... → "Reset password"
   - User receives new reset link

4. **Set password manually (admin only)**
   - Supabase dashboard → Users
   - Click user
   - Click "Update password"
   - Enter new password
   - Click Save

---

## Deployment Issues

### Issue: "Netlify deployment failed"

**Symptoms**:
- GitHub shows deployment failed
- Can't access site
- Build error in Netlify dashboard

**Solutions**:

1. **Check Netlify build logs**
   - Go to: https://app.netlify.com/sites/episafe-ai-gabmn0704/deploys
   - Click failed deployment
   - Click "Deploy log"
   - Read error message carefully

2. **Common build errors**:

   **Error**: `npm ERR! ERESOLVE unable to resolve dependency tree`
   ```bash
   # Solution:
   npm install --legacy-peer-deps
   # Or update dependencies
   npm update
   npm install
   ```

   **Error**: `env: variable not set`
   ```bash
   # Solution: Add missing environment variable
   # Go to Netlify → Settings → Build & deploy → Environment
   # Add: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```

   **Error**: `SyntaxError: Unexpected token`
   ```bash
   # Solution: Check for TypeScript errors
   npm run type-check
   # Fix any errors before pushing to GitHub
   ```

3. **Rollback to previous deployment**
   - Go to: Netlify → Deploys
   - Find last successful deployment
   - Click "Publish deploy"
   - Site reverts to that version

4. **Re-trigger deployment**
   - Go to: GitHub → ProyectoFinalPatrones
   - Make any small change and commit
   - Push to main branch
   - Netlify auto-deploys

---

### Issue: "Environment variables not working"

**Symptoms**:
- `VITE_SUPABASE_URL` is undefined
- Frontend can't connect to database
- Error: "Cannot read property 'from' of null"

**Solutions**:

1. **Set variables in Netlify**
   - Go to: https://app.netlify.com/sites/episafe-ai-gabmn0704
   - Click Settings
   - Click "Build & deploy"
   - Click "Environment"
   - Add/update variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

2. **Variables must start with `VITE_`**
   - Frontend (Vite) only exposes `VITE_*` variables
   - Backend would use `NODE_ENV`, etc. (no prefix)
   - Don't prefix with `VITE_` if backend-only

3. **Redeploy after adding variables**
   - Go to: Netlify → Deploys
   - Click "Trigger deploy" → "Deploy site"
   - Previous deploy won't have new variables
   - Current deploy will pick them up

4. **Test variables in code**
   ```typescript
   // frontend/src/lib/supabase.ts
   console.log("URL:", import.meta.env.VITE_SUPABASE_URL);
   console.log("Key:", import.meta.env.VITE_SUPABASE_ANON_KEY);
   // Should print values, not undefined
   ```

---

## FAQ

### Q: Can I use EpiSafe AI offline?

**A**: Currently no - it requires internet and Supabase connection. Offline support is planned for Phase 2 (Progressive Web App with local sync). For now, you need internet to load and save data.

### Q: How is my data protected?

**A**: 
- Encrypted in transit (HTTPS/TLS 1.3)
- Encrypted at rest (PostgreSQL encryption)
- Row-Level Security (RLS) policies ensure only you can see your data
- See [SECURITY.md](./SECURITY.md) for details

### Q: Can I delete my account?

**A**: Yes:
1. Go to your account settings (future implementation)
2. Or email gabmn0704@gmail.com to request deletion
3. We'll delete all your data within 30 days

### Q: Is this HIPAA compliant?

**A**: Not yet officially certified, but we follow HIPAA security best practices. For medical/sensitive use cases, contact us for HIPAA compliance roadmap.

### Q: Can I share data with my doctor?

**A**: Currently no, but it's planned for Phase 1. Future versions will allow:
- Generate PDF reports to share
- Give doctor read-only access to your data
- FHIR-standard data export

### Q: What if I forget my password?

**A**: 
1. Click "Forgot password" on login screen
2. Check email for reset link
3. Click link and set new password
4. If stuck, email support

### Q: Why am I logged out?

**A**: Session expires after 30 days. Also: idle logout after 15 minutes of inactivity for security. Just log in again.

### Q: Can I use multiple devices?

**A**: Yes! Login on any device with your email/password or Google OAuth. All devices see same data.

### Q: What if I find a security vulnerability?

**A**: Please report responsibly! Don't post on GitHub. Email gabmn0704@gmail.com with subject `[SECURITY]` and details. See [SECURITY.md](./SECURITY.md) for responsible disclosure.

---

## Getting Help

### Where to find help

| Issue Type | Where to go | Response Time |
|-----------|------------|----------------|
| Bug report | GitHub Issues | 1-7 days |
| Feature request | GitHub Discussions | 1-14 days |
| Security | Email gabmn0704@gmail.com | Within 24 hours |
| Account/Data | Email with subject "Account Issue" | Within 48 hours |
| Technical support | GitHub Discussions | 1-7 days |

### How to report a bug

1. **Check if it's already reported**
   - Go to: https://github.com/gabmn0704/ProyectoFinalPatrones/issues
   - Search for your issue
   - If found, comment with more details

2. **Create new issue**
   - Click "New issue"
   - **Title**: Short description (e.g., "Daily log won't save")
   - **Description**: 
     - What were you doing?
     - What happened?
     - What did you expect?
     - Browser/device info?
   - **Labels**: Bug, Frontend, Backend, etc.

3. **Example bug report**:
   ```
   Title: Daily log form validation error

   **Steps to reproduce:**
   1. Click "Add Daily Log"
   2. Enter sleep hours: 25 (invalid)
   3. Click "Save"
   
   **Expected behavior:**
   Error message: "Sleep hours must be 0-24"
   
   **Actual behavior:**
   No error shown, form accepted invalid data
   
   **Environment:**
   - Browser: Chrome 120.0
   - OS: Windows 11
   - Device: Desktop
   ```

### How to request a feature

1. **Go to Discussions**
   - https://github.com/gabmn0704/ProyectoFinalPatrones/discussions
   - Click "New discussion" → "Ideas"

2. **Describe the feature**
   - What problem does it solve?
   - How would you use it?
   - Sketch/mockup if you have one

3. **Example feature request**:
   ```
   Title: Ability to export data as PDF

   **Problem**: I want to share my health data with my doctor without them accessing the full app.

   **Proposed solution**: Add "Export as PDF" button that creates a formatted report with my health data and charts.

   **How it would help**: Easier to share with healthcare providers.
   ```

---

**Last Updated**: 2024-01-15  
**Maintained By**: Support Team  
**Next Review**: Quarterly
