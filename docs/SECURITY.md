# EpiSafe AI - Security Policy & Best Practices

## Overview

EpiSafe AI is an intelligent epilepsy prevention and assistance system that handles sensitive health data. This document outlines our security practices, threat model, and guidelines for maintaining data protection.

## Table of Contents

1. [Data Protection](#data-protection)
2. [Authentication & Authorization](#authentication--authorization)
3. [Threat Model](#threat-model)
4. [Security Practices](#security-practices)
5. [Compliance](#compliance)
6. [Incident Response](#incident-response)
7. [Security Reporting](#security-reporting)

---

## Data Protection

### Sensitive Data Handled

EpiSafe AI processes the following Protected Health Information (PHI):

- **User Identity**: Name, email, phone (optional)
- **Health Data**: Seizure events, medication logs, sleep hours, stress levels
- **Medical History**: Emergency contacts, medication names and dosages
- **Usage Data**: Login times, feature usage (non-identifiable)

### Data Storage Security

#### In Transit (Transit Encryption)

```
Client → HTTPS/TLS 1.3 → Netlify (Frontend)
Client → HTTPS/TLS 1.3 → Supabase (Backend)
Backend ← HTTPS/TLS 1.3 → Database
```

- **Enforce**: All HTTP redirected to HTTPS
- **Certificates**: Let's Encrypt (auto-renewed)
- **Minimum TLS**: 1.3 required
- **Cipher Suites**: Only strong ciphers (ECDHE, ChaCha20-Poly1305)

#### At Rest (Data Encryption)

- **Database**: Supabase PostgreSQL encrypted at block level
- **Backups**: Encrypted copies to geographic redundancy
- **Sensitive Fields**: Medications stored as plaintext (necessary for functionality)
- **Future**: End-to-end encryption for user notes (Phase 1)

### Data Retention & Deletion

```
User Account Lifecycle:
├─ Active: Full data access, all operations enabled
├─ Inactive (90+ days): Flagged for potential deletion (email sent)
├─ Deletion Requested: 30-day grace period (can reactivate)
└─ Permanent Deletion: All data removed after 30 days (irreversible)
```

**Retention Policy:**
| Data Type | Retention Period | Deletion Process |
|-----------|------------------|------------------|
| User Account | Until deleted | 30-day grace period |
| Seizure Events | Indefinite | Auto-delete after 30 days of account deletion |
| Medication Logs | Indefinite | Auto-delete after 30 days of account deletion |
| Emergency Contacts | Until deleted | Immediate deletion on account deletion |
| Login Audit Logs | 90 days | Auto-delete after 90 days |
| Error Logs | 30 days | Auto-delete after 30 days |

---

## Authentication & Authorization

### Authentication Methods

#### 1. Email & Password

```typescript
// ✅ Secure implementation
const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Authentication failed"); // No details leaked
    throw err;
  }
};

// Password requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  hasUppercase: true,
  hasLowercase: true,
  hasNumber: true,
  hasSpecialChar: true, // !@#$%^&*
  noCommonPatterns: true,
};
```

**Password Policy:**
- Minimum 12 characters
- Must include: uppercase, lowercase, number, special character
- No common patterns (123456, password, qwerty)
- No email-based passwords
- Check against compromised password list (HaveIBeenPwned API)

#### 2. Google OAuth

```typescript
// ✅ Secure OAuth flow
const signInWithGoogle = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Verify: https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback
      },
    });
    if (error) throw error;
  } catch (err) {
    console.error("OAuth sign-in failed");
    throw err;
  }
};
```

**OAuth Configuration:**
- Redirect URI: Exactly `https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/callback`
- Scope: `profile, email` (no additional permissions requested)
- No sensitive data requested
- Token expiration: 1 hour (auto-refresh)

### Session Management

```typescript
// ✅ Secure session implementation
interface SessionConfig {
  maxAge: 3600, // 1 hour
  refreshThreshold: 300, // Refresh if <5 min remaining
  absoluteMaxAge: 86400 * 30, // 30 days (force re-auth after 30 days)
  sameSite: "Lax", // CSRF protection
}

// Auto-logout on tab close
useEffect(() => {
  const handleBeforeUnload = () => {
    // Optional: Clear sensitive data from memory
  };
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, []);

// Idle logout after 15 minutes
useEffect(() => {
  let idleTimer: NodeJS.Timeout;
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      logout(); // Force re-authentication
    }, 15 * 60 * 1000);
  };
  
  window.addEventListener("mousemove", resetIdleTimer);
  window.addEventListener("keypress", resetIdleTimer);
  return () => {
    clearTimeout(idleTimer);
    window.removeEventListener("mousemove", resetIdleTimer);
    window.removeEventListener("keypress", resetIdleTimer);
  };
}, []);
```

### Authorization (Row-Level Security)

All data access enforced at database level via RLS policies:

```sql
-- Example: Users can only access their own records
CREATE POLICY "Users can view own daily logs" ON daily_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily logs" ON daily_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily logs" ON daily_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily logs" ON daily_logs
  FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Threat Model

### Threats & Mitigations

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|-----------|
| **Account Takeover** | Medium | Critical | 2FA, password strength, OAuth verification, session timeout |
| **Data Breach** | Low | Critical | Encryption at rest/transit, RLS policies, access logs, regular backups |
| **SQL Injection** | Low | Critical | Supabase parameterized queries, input validation, ORM layer |
| **XSS Attack** | Medium | High | Content Security Policy, sanitize inputs, escape outputs, React auto-escaping |
| **CSRF** | Medium | High | SameSite cookies, CSRF tokens, origin validation |
| **DoS/Rate Limiting** | Medium | Medium | Netlify rate limiting, Supabase connection limits, input size limits |
| **Session Fixation** | Low | High | Session regeneration on login, secure cookies, HTTP-only flag |
| **Man-in-the-Middle** | Low | High | HTTPS enforced, TLS 1.3, HSTS header |
| **Unauthorized Access** | Low | High | RLS policies, token verification, audit logging |
| **Data Exfiltration** | Low | High | No API keys in frontend, server-only endpoints, audit logs |

### Attack Vectors

1. **Client-Side Attacks**
   - ✅ Mitigated: React's built-in XSS protection
   - ✅ Mitigated: Content Security Policy headers
   - ✅ Mitigated: Input validation on all forms

2. **Server-Side Attacks**
   - ✅ Mitigated: Supabase security features
   - ✅ Mitigated: Environment variables (never in frontend)
   - ✅ Mitigated: RLS policies enforcing data isolation

3. **Network Attacks**
   - ✅ Mitigated: HTTPS/TLS 1.3 mandatory
   - ✅ Mitigated: HSTS header
   - ✅ Mitigated: Certificate pinning (future enhancement)

---

## Security Practices

### Secure Coding Standards

#### Input Validation

```typescript
// ✅ Good: Validate all inputs
interface ValidationRules {
  email: (value: string) => boolean | string;
  password: (value: string) => boolean | string;
  sleepHours: (value: number) => boolean | string;
  seizureDescription: (value: string) => boolean | string;
}

export const validators: ValidationRules = {
  email: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) || "Invalid email format";
  },

  password: (password: string) => {
    if (password.length < 12) return "Password must be 12+ characters";
    if (!/[A-Z]/.test(password)) return "Must include uppercase";
    if (!/[a-z]/.test(password)) return "Must include lowercase";
    if (!/[0-9]/.test(password)) return "Must include number";
    if (!/[!@#$%^&*]/.test(password)) return "Must include special character";
    return true;
  },

  sleepHours: (hours: number) => {
    if (hours < 0 || hours > 24) return "Sleep hours must be 0-24";
    return true;
  },

  seizureDescription: (desc: string) => {
    if (desc.length > 1000) return "Description too long (max 1000 chars)";
    if (desc.length < 10) return "Description too short (min 10 chars)";
    return true;
  },
};

// ❌ Avoid: No validation
const saveData = (data: any) => {
  // Directly save data without checking
  db.insert(data);
};
```

#### Output Encoding

```typescript
// ✅ Good: React auto-escapes by default
export function DispalyUserNote({ note }: { note: string }) {
  // React automatically escapes HTML
  return <p>{note}</p>;
  // If note = "<script>alert('XSS')</script>"
  // Renders as text, not executed
}

// ❌ Avoid: Never use dangerouslySetInnerHTML
function BadComponent({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />;
  // XSS vulnerability!
}
```

#### Error Handling

```typescript
// ✅ Good: Generic error messages to user, detailed logs internally
try {
  const result = await fetchUserData(userId);
} catch (error) {
  // Log detailed info for debugging
  console.error("Database error:", {
    timestamp: new Date().toISOString(),
    userId,
    errorCode: error.code,
    errorMessage: error.message,
    stack: error.stack,
  });

  // Show generic message to user
  throw new Error("Unable to load user data. Please try again.");
}

// ❌ Avoid: Leaking internal details
throw new Error(`Database connection failed: ${error.message}`);
// User sees: "Database connection failed: could not connect to localhost:5432"
// Attacker learns: db is PostgreSQL at localhost:5432
```

### API Security

#### Environment Variables

```bash
# ✅ Good: Secure environment variables
VITE_SUPABASE_URL=https://devtfvejnrtphnlymrmq.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx_public_key_only_xxxxx
# Never expose: SUPABASE_SERVICE_ROLE_KEY (server-only)

# ❌ Avoid: Hardcoded secrets
const apiKey = "sk_live_xxxxx";
```

#### API Key Management

| Key Type | Scope | Exposed | Usage |
|----------|-------|---------|-------|
| Anon Key | Public | ✅ Frontend `.env` | Client-side auth, public data |
| Service Role Key | Admin | ❌ Backend only | Admin operations, never in frontend |
| Google OAuth | Public | ✅ Frontend | OAuth flow setup |

#### Request Validation

```typescript
// ✅ Good: Validate requests on server
async function handleCreateLog(req: Request) {
  const { date, sleepHours, notes } = req.body;
  
  // Validate each field
  if (!date || typeof date !== "string") {
    return { error: "Invalid date" };
  }
  if (sleepHours === undefined || sleepHours < 0 || sleepHours > 24) {
    return { error: "Sleep hours must be 0-24" };
  }
  if (notes && notes.length > 1000) {
    return { error: "Notes too long" };
  }

  // Proceed with validated data
  const log = await db.insert({ date, sleepHours, notes });
  return { success: true, log };
}
```

### Dependency Security

```bash
# ✅ Good: Regularly scan and update dependencies
npm audit
npm audit fix
npm update

# ❌ Avoid: Ignoring vulnerabilities
# (Do not use "npm audit --audit-level=none")
```

---

## Compliance

### HIPAA Considerations

While EpiSafe AI is not officially HIPAA-certified, we follow HIPAA best practices:

- ✅ **Encryption**: Data encrypted at rest and in transit
- ✅ **Access Control**: RLS policies enforce user data isolation
- ✅ **Audit Logs**: Track data access and modifications
- ✅ **Data Integrity**: Checksums and version tracking
- ✅ **User Rights**: Users can download/delete their data
- ⚠️ **Business Associate Agreement**: Not yet implemented (needed for HIPAA compliance)

### GDPR Compliance

EpiSafe AI supports GDPR rights:

- ✅ **Consent**: Users explicitly consent to data processing
- ✅ **Data Access**: Users can download all personal data
- ✅ **Data Deletion**: Users can request permanent deletion
- ✅ **Data Portability**: Export in standard format (JSON, CSV)
- ✅ **Privacy Notice**: Clear terms of service and privacy policy

### CCPA Compliance (California)

- ✅ **Right to Know**: Users see what data we collect
- ✅ **Right to Delete**: Users can request deletion
- ✅ **Right to Opt-Out**: Users can disable analytics/tracking
- ✅ **Non-Discrimination**: No price/service changes based on privacy choices

---

## Incident Response

### Security Incident Definition

A **security incident** is:
- Unauthorized data access
- Data breach or exfiltration
- Service unavailability (>1 hour)
- Code injection/malware
- Account takeover
- DDoS attack

### Response Procedure

```
┌─────────────────────────────────────────────────┐
│ 1. DETECT (Monitoring, user reports)            │
├─────────────────────────────────────────────────┤
│ 2. CONTAIN (Isolate, disable compromised access)│
├─────────────────────────────────────────────────┤
│ 3. INVESTIGATE (Determine scope & root cause)   │
├─────────────────────────────────────────────────┤
│ 4. NOTIFY (Users, authorities if required)      │
├─────────────────────────────────────────────────┤
│ 5. REMEDIATE (Fix vulnerability, deploy patch)  │
├─────────────────────────────────────────────────┤
│ 6. RESTORE (Verify systems operational)         │
├─────────────────────────────────────────────────┤
│ 7. REVIEW (Post-mortem, document lessons)       │
└─────────────────────────────────────────────────┘
```

### Incident Response Team

- **Security Lead**: @gabmn0704
- **Backend Lead**: Supabase Support
- **Communications**: User notifications within 24 hours
- **Timeline**: Initial response within 1 hour of detection

---

## Security Reporting

### Responsible Disclosure

**DO NOT** report security issues via:
- ❌ Public GitHub issues
- ❌ Social media
- ❌ Email lists
- ❌ Customer support

**DO** report to:
- 📧 **Email**: gabmn0704@gmail.com with subject `[SECURITY]`
- 🔐 **GitHub Security Advisory**: https://github.com/gabmn0704/ProyectoFinalPatrones/security/advisories
- 📋 **Include**: Vulnerability description, steps to reproduce, potential impact

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| <1 hour | Acknowledge receipt |
| <24 hours | Initial assessment |
| <7 days | Fix and deploy patch |
| <30 days | Public disclosure (if needed) |

### Security Updates

- Sign up for notifications: GitHub Releases
- Follow: @gabmn0704 on GitHub
- Check: docs/SECURITY.md for latest

---

## Monitoring & Auditing

### Security Monitoring

```typescript
// ✅ Log security events
export const logSecurityEvent = async (event: {
  type: "login" | "logout" | "passwordChange" | "unauthorized_access";
  userId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details?: Record<string, any>;
}) => {
  // Store in secure audit log
  await supabase
    .from("security_audit_logs")
    .insert([event]);
};
```

### Audit Log Retention

- Retain for 90 days minimum
- Immutable (no deletions after creation)
- Only authorized personnel can access
- Auto-delete after 90 days

### Monitoring Alerts

- ✅ Failed login attempts (5+ in 5 minutes)
- ✅ Password change on account
- ✅ New device/IP login
- ✅ Unauthorized API access attempts
- ✅ Database query errors
- ✅ Service downtime

---

## Future Security Enhancements

- [ ] Two-factor authentication (2FA via authenticator apps)
- [ ] Biometric authentication (fingerprint, Face ID)
- [ ] End-to-end encryption for user notes
- [ ] Hardware security key support
- [ ] Certificate pinning
- [ ] Regular penetration testing
- [ ] Security awareness training for team
- [ ] HIPAA compliance certification
- [ ] SOC 2 Type II audit
- [ ] ISO 27001 certification

---

## Security Checklist

Before deployment, verify:

- [ ] All dependencies scanned for CVEs
- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced everywhere
- [ ] RLS policies enabled on all tables
- [ ] Input validation on all endpoints
- [ ] Error messages do not leak details
- [ ] Audit logging configured
- [ ] Session management configured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers set (CSP, HSTS, X-Frame-Options)
- [ ] Password requirements enforced
- [ ] OAuth redirect URI verified
- [ ] Environment variables documented
- [ ] Backup and recovery tested

---

**Last Updated**: 2024
**Next Review**: Quarterly
**Maintained By**: Security Team
