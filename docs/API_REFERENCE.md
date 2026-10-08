# EpiSafe AI - API Reference

## Overview

EpiSafe AI uses Supabase PostgreSQL as its backend, accessed through REST APIs. All endpoints require authentication via JWT token (obtained after login).

**Base URL**: `https://devtfvejnrtphnlymrmq.supabase.co/rest/v1`

**Authentication**: Bearer token in `Authorization` header
```
Authorization: Bearer <access_token>
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Daily Logs](#daily-logs)
3. [Seizure Events](#seizure-events)
4. [Emergency Contacts](#emergency-contacts)
5. [Health Analytics](#health-analytics)
6. [Error Responses](#error-responses)

---

## Authentication

### Login with Email/Password

**Request**
```
POST https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "your_refresh_token",
  "user": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "email_confirmed_at": "2024-01-15T10:30:00Z",
    "phone": "",
    "confirmation_sent_at": "2024-01-15T10:25:00Z",
    "confirmed_at": "2024-01-15T10:30:00Z",
    "last_sign_in_at": "2024-01-15T10:35:00Z",
    "app_metadata": { "provider": "email" },
    "user_metadata": { "full_name": "John Doe" },
    "identities": [],
    "created_at": "2024-01-15T10:25:00Z",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

**Error Response (401 Unauthorized)**
```json
{
  "error": "invalid_grant",
  "error_description": "Invalid login credentials"
}
```

### Refresh Token

**Request**
```
POST https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/token?grant_type=refresh_token
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

**Response (200 OK)**
```json
{
  "access_token": "new_access_token",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token"
}
```

### Logout

**Request**
```
POST https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/logout
Authorization: Bearer <access_token>
```

**Response (204 No Content)**
```
(empty body)
```

---

## Daily Logs

### Data Model

```typescript
interface DailyLog {
  id: string; // UUID
  user_id: string; // UUID (from auth.users)
  date: string; // ISO 8601 date (YYYY-MM-DD)
  sleep_hours: number; // 0-24
  stress_level: number; // 1-10 scale
  caffeine_intake: number; // 0-10 scale
  exercise_minutes: number; // 0-600
  medication_taken: boolean; // true/false
  notes?: string; // Optional free text
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Create Daily Log

**Request**
```
POST /daily_logs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "sleep_hours": 7.5,
  "stress_level": 5,
  "caffeine_intake": 3,
  "exercise_minutes": 30,
  "medication_taken": true,
  "notes": "Felt good today, no triggers"
}
```

**Response (201 Created)**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "auth-user-uuid",
  "date": "2024-01-15",
  "sleep_hours": 7.5,
  "stress_level": 5,
  "caffeine_intake": 3,
  "exercise_minutes": 30,
  "medication_taken": true,
  "notes": "Felt good today, no triggers",
  "created_at": "2024-01-15T14:23:00Z",
  "updated_at": "2024-01-15T14:23:00Z"
}
```

**Error Response (400 Bad Request)**
```json
{
  "code": "PGRST100",
  "message": "Failed to parse request body as JSON",
  "details": ""
}
```

### Get Daily Logs

**Request**
```
GET /daily_logs?date=gte.2024-01-01&date=lte.2024-01-31&order=date.desc
Authorization: Bearer <access_token>
```

**Query Parameters**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| date | filter | `gte.2024-01-01` | Greater than or equal to |
| date | filter | `lte.2024-01-31` | Less than or equal to |
| order | sort | `date.desc` | Sort by date descending |
| limit | pagination | `10` | Return max 10 results |
| offset | pagination | `0` | Skip first 0 results |

**Response (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "auth-user-uuid",
    "date": "2024-01-15",
    "sleep_hours": 7.5,
    "stress_level": 5,
    "caffeine_intake": 3,
    "exercise_minutes": 30,
    "medication_taken": true,
    "notes": "Felt good today",
    "created_at": "2024-01-15T14:23:00Z",
    "updated_at": "2024-01-15T14:23:00Z"
  },
  {
    "id": "660f9511-f40c-52e5-b827-557766551111",
    "user_id": "auth-user-uuid",
    "date": "2024-01-14",
    "sleep_hours": 6.0,
    "stress_level": 7,
    "caffeine_intake": 5,
    "exercise_minutes": 15,
    "medication_taken": true,
    "notes": "Stressed day",
    "created_at": "2024-01-14T18:45:00Z",
    "updated_at": "2024-01-14T18:45:00Z"
  }
]
```

### Update Daily Log

**Request**
```
PATCH /daily_logs?id=eq.550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "stress_level": 4,
  "notes": "Updated - stress improved"
}
```

**Response (200 OK)**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "auth-user-uuid",
    "date": "2024-01-15",
    "sleep_hours": 7.5,
    "stress_level": 4,
    "caffeine_intake": 3,
    "exercise_minutes": 30,
    "medication_taken": true,
    "notes": "Updated - stress improved",
    "created_at": "2024-01-15T14:23:00Z",
    "updated_at": "2024-01-15T14:35:00Z"
  }
]
```

### Delete Daily Log

**Request**
```
DELETE /daily_logs?id=eq.550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response (204 No Content)**
```
(empty body)
```

---

## Seizure Events

### Data Model

```typescript
interface SeizureEvent {
  id: string; // UUID
  user_id: string; // UUID
  date: string; // ISO 8601 date
  time: string; // HH:MM format
  duration_minutes: number; // 0-600
  severity: "mild" | "moderate" | "severe"; // Classification
  description?: string; // Free text notes
  location?: string; // Where it happened
  witnesses?: string[]; // Contact info for witnesses
  medications_given?: string[]; // What was administered
  hospital_visit: boolean; // Whether they went to hospital
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Create Seizure Event (Emergency Mode)

**Request**
```
POST /seizure_events
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "time": "14:23",
  "duration_minutes": 2,
  "severity": "severe",
  "description": "Sudden onset, lost consciousness",
  "location": "Home - Living room",
  "hospital_visit": false
}
```

**Response (201 Created)**
```json
{
  "id": "660f9511-f40c-52e5-b827-557766551111",
  "user_id": "auth-user-uuid",
  "date": "2024-01-15",
  "time": "14:23",
  "duration_minutes": 2,
  "severity": "severe",
  "description": "Sudden onset, lost consciousness",
  "location": "Home - Living room",
  "witnesses": [],
  "medications_given": [],
  "hospital_visit": false,
  "created_at": "2024-01-15T14:23:15Z",
  "updated_at": "2024-01-15T14:23:15Z"
}
```

### Get Seizure Events

**Request**
```
GET /seizure_events?date=gte.2024-01-01&order=date.desc,time.desc
Authorization: Bearer <access_token>
```

**Query Parameters**
| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| date | filter | `gte.2024-01-01` | Filter by date range |
| severity | filter | `eq.severe` | Filter by severity |
| order | sort | `date.desc` | Sort by date descending |

**Response (200 OK)**
```json
[
  {
    "id": "660f9511-f40c-52e5-b827-557766551111",
    "user_id": "auth-user-uuid",
    "date": "2024-01-15",
    "time": "14:23",
    "duration_minutes": 2,
    "severity": "severe",
    "description": "Sudden onset, lost consciousness",
    "location": "Home - Living room",
    "witnesses": ["emergency-contact@example.com"],
    "medications_given": ["Diazepam"],
    "hospital_visit": false,
    "created_at": "2024-01-15T14:23:15Z",
    "updated_at": "2024-01-15T14:23:15Z"
  }
]
```

### Update Seizure Event

**Request**
```
PATCH /seizure_events?id=eq.660f9511-f40c-52e5-b827-557766551111
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "severity": "moderate",
  "hospital_visit": true
}
```

**Response (200 OK)**
```json
[
  {
    "id": "660f9511-f40c-52e5-b827-557766551111",
    "user_id": "auth-user-uuid",
    "date": "2024-01-15",
    "time": "14:23",
    "duration_minutes": 2,
    "severity": "moderate",
    "description": "Sudden onset, lost consciousness",
    "location": "Home - Living room",
    "witnesses": ["emergency-contact@example.com"],
    "medications_given": ["Diazepam"],
    "hospital_visit": true,
    "created_at": "2024-01-15T14:23:15Z",
    "updated_at": "2024-01-15T14:35:22Z"
  }
]
```

---

## Emergency Contacts

### Data Model

```typescript
interface EmergencyContact {
  id: string; // UUID
  user_id: string; // UUID
  name: string; // Contact name
  relationship: string; // e.g., "Spouse", "Parent", "Doctor"
  phone: string; // Phone number
  email: string; // Email address
  notify_on_seizure: boolean; // Auto-notify on seizure
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### Add Emergency Contact

**Request**
```
POST /emergency_contacts
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "relationship": "Spouse",
  "phone": "+1-555-0123",
  "email": "jane.doe@example.com",
  "notify_on_seizure": true
}
```

**Response (201 Created)**
```json
{
  "id": "770g0622-g51d-63f6-c938-668877662222",
  "user_id": "auth-user-uuid",
  "name": "Jane Doe",
  "relationship": "Spouse",
  "phone": "+1-555-0123",
  "email": "jane.doe@example.com",
  "notify_on_seizure": true,
  "created_at": "2024-01-15T14:40:00Z",
  "updated_at": "2024-01-15T14:40:00Z"
}
```

### Get Emergency Contacts

**Request**
```
GET /emergency_contacts
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
[
  {
    "id": "770g0622-g51d-63f6-c938-668877662222",
    "user_id": "auth-user-uuid",
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1-555-0123",
    "email": "jane.doe@example.com",
    "notify_on_seizure": true,
    "created_at": "2024-01-15T14:40:00Z",
    "updated_at": "2024-01-15T14:40:00Z"
  }
]
```

### Update Emergency Contact

**Request**
```
PATCH /emergency_contacts?id=eq.770g0622-g51d-63f6-c938-668877662222
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "phone": "+1-555-9999",
  "notify_on_seizure": false
}
```

**Response (200 OK)**
```json
[
  {
    "id": "770g0622-g51d-63f6-c938-668877662222",
    "user_id": "auth-user-uuid",
    "name": "Jane Doe",
    "relationship": "Spouse",
    "phone": "+1-555-9999",
    "email": "jane.doe@example.com",
    "notify_on_seizure": false,
    "created_at": "2024-01-15T14:40:00Z",
    "updated_at": "2024-01-15T14:50:30Z"
  }
]
```

### Delete Emergency Contact

**Request**
```
DELETE /emergency_contacts?id=eq.770g0622-g51d-63f6-c938-668877662222
Authorization: Bearer <access_token>
```

**Response (204 No Content)**
```
(empty body)
```

---

## Health Analytics

### Trigger Analysis (Read-Only)

**Request**
```
GET /health_analytics/trigger_analysis?month=2024-01
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "month": "2024-01",
  "total_seizures": 3,
  "average_duration_minutes": 2.5,
  "triggers_by_frequency": [
    {
      "trigger": "Sleep deprivation (<5 hours)",
      "count": 3,
      "percentage": 100,
      "correlation_strength": "very_strong"
    },
    {
      "trigger": "High stress (>7/10)",
      "count": 2,
      "percentage": 66.7,
      "correlation_strength": "strong"
    },
    {
      "trigger": "High caffeine (>5 cups)",
      "count": 1,
      "percentage": 33.3,
      "correlation_strength": "moderate"
    }
  ],
  "protective_factors": [
    {
      "factor": "Regular exercise (>30 min)",
      "count": 2,
      "percentage": 66.7,
      "protective_strength": "moderate"
    }
  ]
}
```

### Risk Score (Read-Only)

**Request**
```
GET /health_analytics/daily_risk?date=2024-01-15
Authorization: Bearer <access_token>
```

**Response (200 OK)**
```json
{
  "date": "2024-01-15",
  "risk_score": 72,
  "risk_level": "high",
  "risk_factors": [
    {
      "factor": "Sleep: 5 hours (below 7 hour target)",
      "weight": 0.4,
      "contribution": 32
    },
    {
      "factor": "Stress: 8/10 (elevated)",
      "weight": 0.35,
      "contribution": 28
    },
    {
      "factor": "Caffeine: 6 cups (above normal)",
      "weight": 0.15,
      "contribution": 12
    }
  ],
  "recommendations": [
    "Prioritize sleep: aim for 8 hours tonight",
    "Practice stress management: meditation or deep breathing",
    "Reduce caffeine intake for the rest of the day"
  ]
}
```

### Seizure Patterns (Read-Only)

**Request**
```
GET /health_analytics/seizure_patterns?period=30days
Authorization: Bearer <access_token>
```

**Query Parameters**
| Parameter | Type | Options | Description |
|-----------|------|---------|-------------|
| period | string | `7days`, `30days`, `90days`, `1year` | Time period to analyze |

**Response (200 OK)**
```json
{
  "period": "30days",
  "total_seizures": 5,
  "frequency_per_week": 1.25,
  "average_severity": "moderate",
  "severity_distribution": {
    "mild": 1,
    "moderate": 3,
    "severe": 1
  },
  "average_duration_minutes": 2.8,
  "most_common_time": {
    "hour": 14,
    "frequency": "2 out of 5 seizures"
  },
  "trend": "stable"
}
```

---

## Error Responses

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PATCH/DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Invalid input format |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Insufficient permissions (RLS policy) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Constraint violation (e.g., duplicate date) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database or server issue |

### Error Response Format

```json
{
  "code": "PGRST100",
  "message": "Failed to parse request body as JSON",
  "details": "",
  "hint": "Check that your request body is valid JSON"
}
```

### Common Errors

#### 401 Unauthorized

```json
{
  "code": "PGRST100",
  "message": "jwt expired",
  "details": "Token expired at 2024-01-15T15:00:00Z"
}
```

**Solution**: Refresh token using `/auth/v1/token` endpoint

#### 403 Forbidden (RLS Policy)

```json
{
  "code": "PGRST100",
  "message": "new row violates row-level security policy",
  "details": "Policy check failed for daily_logs"
}
```

**Solution**: User can only access their own data; verify `user_id` matches authenticated user

#### 409 Conflict

```json
{
  "code": "PGRST100",
  "message": "duplicate key value violates unique constraint",
  "details": "Key (user_id, date)=(uuid, 2024-01-15) already exists"
}
```

**Solution**: Each user can have only one daily log per date; update existing log instead

---

## Rate Limiting

Supabase enforces rate limits:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth endpoints | 10 requests | 1 minute per IP |
| API endpoints | 100 requests | 1 minute per user |
| File uploads | 10 MB | Per request |

**Response Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Example Requests

### Complete Login & Create Daily Log

```bash
#!/bin/bash

# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST \
  "https://devtfvejnrtphnlymrmq.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

# 2. Create daily log
curl -X POST \
  "https://devtfvejnrtphnlymrmq.supabase.co/rest/v1/daily_logs" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "sleep_hours": 7.5,
    "stress_level": 5,
    "caffeine_intake": 3,
    "exercise_minutes": 30,
    "medication_taken": true,
    "notes": "Felt good today"
  }'
```

---

**Last Updated**: 2024
**Version**: 1.0
**API Status**: ✅ Production
