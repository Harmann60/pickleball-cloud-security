# 🥒 Pickleball Cloud Security

### Secure Pickleball Court Management System Using AWS Cloud Security Best Practices

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20IAM%20%7C%20S3%20%7C%20CloudTrail%20%7C%20CloudWatch-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![Tests](https://img.shields.io/badge/tests-23%20passing-brightgreen)](#-testing)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

> A college mini-project demonstration of how **AWS cloud security best practices** — least-privilege IAM, encrypted private storage, restricted networking, audit logging and monitoring — protect a small court-booking application from unauthorized access, data breaches and cloud misconfigurations.
>
> ⚠️ **This is a demonstration system with fictional data. It is not production-ready and must not be used with real personal or payment data.**

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Architecture](#-architecture)
- [Security Design](#-security-design)
- [Project Structure](#-project-structure)
- [Local Development](#-local-development)
- [Testing](#-testing)
- [AWS Deployment](#-aws-deployment)
- [Cost Control](#-cost-control)
- [Roadmap](#-roadmap)
- [Limitations & Future Work](#-limitations--future-work)

---

## 🎯 Problem Statement

> How can AWS cloud security best practices be implemented to protect a Pickleball Court Management System from unauthorized access, data breaches, cloud misconfigurations, and security threats?

The project answers this with a small but **fully working** web application deployed on AWS, where every component demonstrates a specific security control that can be tested, evidenced and explained.

**Academic coverage:** IAM · Secure cloud architecture · Data protection & encryption · Cloud misconfigurations · Monitoring & logging · Cloud security best practices.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard** | Live view of fictional courts, upcoming bookings and tournaments |
| 📅 **Court booking** | Sample booking form with strict **server-side validation** and double-booking prevention |
| 🔐 **Admin view** | Server-side authorization (Bearer token) — API returns **403** even when called directly with `curl` |
| 📁 **Tournament reports** | Authorized upload of tournament reports to **private, encrypted Amazon S3** (via EC2 instance role — no access keys) |
| 🛡️ **Security headers** | CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy` via Helmet |
| 🧪 **Test suite** | 23 automated tests covering validation, authorization and API behaviour |
| 🪵 **Audit & monitoring** | CloudTrail management-event logging + CloudWatch metric filter & alarm |

---

## 🏗️ Architecture

```
                         ┌──────────────────────────────────────────────┐
  Browser ──── HTTP:3000 ─►  EC2 t3.micro (Amazon Linux 2023)           │
                         │   ┌────────────────────────────────────┐    │
                         │   │  Node.js + Express application     │    │
                         │   │  • Dashboard  • Booking  • Admin   │    │
                         │   └────────────────────────────────────┘    │
                         │        Instance Role (least privilege)      │
                         └───────────────────┬──────────────────────────┘
                                             │ s3:PutObject only
                                             ▼
                          ┌────────────────────────────────────────┐
                          │  Amazon S3 — private bucket            │
                          │  ✓ Block Public Access (all 4)         │
                          │  ✓ SSE-S3 encryption (AES-256)         │
                          │  ✓ Deny-unencrypted / public policies  │
                          └────────────────────────────────────────┘

   Console / CLI activity ──► CloudTrail (mgmt events, multi-region)
                                        │
                                        ▼
                          CloudWatch log metric filter ──► Alarm ──► SNS e-mail
```

**Network exposure — nothing else is open:**

| Direction | Port | Source | Rationale |
|---|---|---|---|
| Inbound | 22 (SSH) | Verified public IP `/32` only | Never `0.0.0.0/0` |
| Inbound | 3000 (app) | `0.0.0.0/0` | Demo web app; no secrets in transit |
| Outbound | all | `0.0.0.0/0` | Package updates, S3, CloudWatch *(documented limitation)* |

---

## 🛡️ Security Design

### Identity & Access Management
- **EC2 instance role** — the application calls S3 with temporary credentials delivered by the instance metadata service. **No AWS access keys exist in code, the environment, or Git.**
- **Least privilege** — the role's policy allows only `s3:PutObject` on `arn:aws:s3:::pickleball-reports-*/tournament-reports/*`. Nothing else.
- **Separate IAM user** for administrative demonstration, console-only, MFA-enabled.
- **Root account**: MFA enforced, never used for daily work.

### Data protection
- S3 **Block Public Access**: all four settings enabled.
- **SSE-S3 (AES-256)** encryption at rest, enforced bucket-wide.
- Bucket policy additionally **denies unencrypted uploads** and **rejects non-HTTPS** requests.
- Unauthorized access verified as **AccessDenied** in security tests.

### Application security
- **Server-side validation** on every input (regex + length + domain checks).
- **Server-side authorization** — hiding UI is never treated as access control; every admin API call is verified server-side with constant-time token comparison.
- **No `innerHTML`** — the frontend renders all dynamic content via `textContent`, preventing DOM XSS.
- **Centralized error handler** — stack traces never reach clients; details are logged server-side only.
- **Credential-material rejection** — the report upload refuses content containing private keys or AWS secret patterns (defence in depth).
- **Prototype labelling** — the token-based admin control is explicitly documented as a prototype, not an authentication system.

### Monitoring & audit
- **CloudTrail**: multi-region trail, management events only (first copy free), delivered to CloudWatch Logs.
- **CloudWatch**: metric filter on IAM-sensitive API calls → alarm → SNS e-mail notification.
- Investigation runbook: find event in trail → identify principal, source IP, action → contain → remediate.

### Misconfiguration lab
A controlled, reversible misconfiguration is demonstrated in an isolated test policy (over-permissive IAM statement), with evidence of **finding → risk → remediation → verification**.

---

## 📂 Project Structure

```
pickleball-cloud-security/
├── src/
│   ├── server.js              # Bootstrap
│   ├── app.js                 # Express app, Helmet, body limits
│   ├── routes/api.js          # Public + admin endpoints
│   ├── middleware/
│   │   ├── adminAuth.js       # Server-side Bearer authorization
│   │   ├── errorHandler.js    # Safe centralized errors
│   │   └── notFoundHandler.js
│   ├── services/
│   │   ├── dataStore.js       # Fictional in-memory data
│   │   ├── validator.js       # Server-side input validation
│   │   └── storage.js         # Local ⇄ S3 storage switch
│   └── public/                # index.html · styles.css · app.js
├── tests/                     # Automated test suite
├── aws-config/                # IAM / EC2 / S3 configuration artifacts
├── monitoring/                # CloudTrail & CloudWatch definitions
├── security-tests/            # Evidence of security verification
├── architecture/              # Diagrams
├── docs/                      # Report & presentation
├── .env.example               # Documented configuration template
└── package.json
```

---

## 🚀 Local Development

**Prerequisites:** Node.js ≥ 20 (developed on v22 LTS), npm, Git.

```bash
git clone https://github.com/Harmann60/pickleball-cloud-security.git
cd pickleball-cloud-security
npm install
cp .env.example .env        # optional; defaults work fine locally
npm start                   # http://localhost:3000
```

Or with live reload:

```bash
npm run dev
```

Local mode (`STORAGE_MODE=local`) writes uploads to `local-storage/` — **no AWS account or credentials needed**.

### Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `STORAGE_MODE` | `local` | `local` file store or `s3` on AWS |
| `AWS_S3_BUCKET` | — | Target bucket (only when `STORAGE_MODE=s3`) |
| `ADMIN_TOKEN` | random/start | Bearer token for admin endpoints |
| `NODE_ENV` | `development` | `production` hides internal error details |

> 🔑 `.env` is git-ignored. Never commit real configuration values or credentials.

---

## 🧪 Testing

```bash
npm test
```

**23 automated tests** covering:

- Input validation (injection attempts, malformed email/date/time, invalid court, past dates, bad durations)
- Credential-material detection in uploads
- API behaviour (booking creation, 400 on invalid input, 409 on double-booking)
- Authorization (403 without token, 403 with wrong token, 200 with correct token)
- Security headers and JSON 404 handling

Plus manual security tests (evidence in `security-tests/`):
- Direct `curl` to admin endpoints without a token → **403**
- Anonymous S3 access attempt → **AccessDenied**
- Unencrypted S3 upload attempt → **AccessDenied** by bucket policy

---

## ☁️ AWS Deployment

Provisioning is deliberately **step-by-step** so every control can be evidenced:

| Stage | Component | Key control |
|---|---|---|
| 5 | IAM roles, users, policies | Least privilege, no long-lived keys on EC2 |
| 6 | S3 bucket | Block Public Access, SSE-S3, deny-by-default policy |
| 7 | EC2 + security group | SSH restricted to one IP, only app port exposed |
| 8 | Application deployment | systemd service, env vars, health check |
| 9 | CloudTrail + CloudWatch | Management-event audit, alarm on sensitive API calls |
| 10 | Security tests & misconfiguration lab | Finding → remediation → verification evidence |

Full commands and verification steps are documented in `docs/report/`.

---

## 💰 Cost Control

Designed for **₹0 within the AWS Free Tier** (12 months from account creation):

| Resource | Free-tier usage |
|---|---|
| EC2 t3.micro | 750 hours/month |
| S3 | 5 GB-months, 20K GETs, 2K PUTs — we use kilobytes |
| CloudTrail | First copy of management events — free |
| CloudWatch | 10 alarms & custom metrics free tier — we use ~1 |
| SNS | 1,000 email notifications/month — we use ~0–1 |

**Guardrails applied:** AWS Free Tier billing alerts enabled, budget alert at minimal threshold, no billable services beyond the list above, and complete cleanup instructions for every resource.

---

## 🗺️ Roadmap

- [x] Stage 1 — Environment & account baseline
- [x] Stage 2 — Minimum architecture finalized
- [x] Stage 3 — Application built & tested locally
- [x] Stage 4 — Functionality & validation testing
- [ ] Stage 5 — IAM roles, users & least-privilege policies
- [ ] Stage 6 — Private, encrypted S3 bucket
- [ ] Stage 7 — Hardened EC2 & security group
- [ ] Stage 8 — Application deployment
- [ ] Stage 9 — CloudTrail & CloudWatch monitoring
- [ ] Stage 10 — Security tests & misconfiguration remediation
- [ ] Stage 11 — Report, presentation & viva preparation

---

## ⚠️ Limitations & Future Work

**Honest limitations (not bugs — deliberate scope choices):**

- HTTP only on port 3000; TLS requires a domain + ACM/CloudFront (documented, not implemented).
- Admin control is a **prototype token**, not a full authentication system (no passwords, sessions or lockout).
- In-memory data store — bookings reset on server restart.
- Single instance, no multi-AZ, no autoscaling — appropriate for a demo, not for production.
- Unrestricted outbound traffic from the instance (common trade-off, flagged in the report).

**Future improvements:** HTTPS via CloudFront + ACM · Cognito user pools · RDS/Aurora with parameterized queries · AWS WAF · GuardDuty · AWS Config conformance packs · CI/CD pipeline with security scanning.

---

## 📜 License

[MIT](LICENSE)

---

<p align="center">
  Built as a college mini-project demonstration · Fictional data only · Not for production use
</p>
