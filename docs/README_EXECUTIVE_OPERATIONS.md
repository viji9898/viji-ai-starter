# README_EXECUTIVE_OPERATIONS.md

# AI-Augmented Executive Operations System

## Overview

This feature introduces an AI-augmented executive operations layer for the organization.

The system ingests operational data from:

- Google Meet notes
- meeting transcripts
- Gmail
- Google Docs
- WhatsApp
- Slack
- manual entries
- operational reports

The objective is to transform fragmented operational activity into:

- searchable organizational memory
- operational intelligence
- executive briefings
- accountability systems
- strategic insights

This is NOT intended to be:

- a task management replacement
- a CRM
- a chatbot

The system acts as:

> an executive operational intelligence layer sitting above normal company workflows.

The architecture should be thought of as:

sources
↓
entities
↓
chunks
↓
intelligence

---

# Core Objectives

## 1. Organizational Memory

Create searchable memory for:

- meetings
- decisions
- blockers
- risks
- tasks
- strategic discussions

Example queries:

- "What did we decide about tea tins?"
- "What vendor issues appeared repeatedly?"
- "What is blocking the 200 pass sales goal?"

---

## 2. Executive Intelligence

Generate:

- daily executive briefings
- operational summaries
- unresolved loop reports
- risk analysis
- strategic observations

---

## 3. Accountability & Coordination

Track:

- open tasks
- delayed follow-ups
- recurring blockers
- unresolved operational loops

---

## 4. Founder Bandwidth Protection

Reduce:

- repeated explanations
- fragmented operational updates
- context switching
- unnecessary escalation

---

# MVP Scope

Initial version focuses ONLY on:

- Gemini meeting notes
- AI extraction
- semantic search
- executive briefings

Google Workspace syncing comes later.

The MVP can start with meetings while the architecture stays source-agnostic for future Gmail, Docs, WhatsApp, Slack, transcript, and manual-entry ingestion.

---

# Recommended Architecture

```txt
React Dashboard
↓
Netlify Functions
↓
Neon Postgres + pgvector
↓
OpenAI APIs
↓
Google Workspace APIs
```

---

# MVP Workflow

The first implementation should be narrow and deterministic.

## Input

- a source record is submitted, with meeting notes or transcripts as the first supported input
- the raw content is stored in the database

## Processing

- source content is parsed into entities
- the content is chunked
- extraction creates structured records for tasks, decisions, blockers, risks, and insights
- embeddings are generated for retrieval

## Output

- the source and its derived entities become searchable
- extracted actions become trackable
- the system can generate executive briefings from accumulated memory

---

# First Implementation Plan

## Phase 1. Database Foundation

Deliver:

- Neon database enabled with pgvector and pgcrypto
- core relational tables
- memory chunk table for embeddings
- simple migration strategy

Primary outcome:

- the project has a stable data model for ingestion and retrieval

## Phase 2. Meeting Ingestion Endpoint

Deliver:

- a Netlify function to accept a source payload, starting with meeting notes or transcripts
- persistence of the raw source record
- creation of a meeting record
- people upsert logic
- processing-state tracking through parse, extract, and embed steps

Primary outcome:

- one input can reliably land in the operational database

## Phase 3. AI Extraction Pipeline

Deliver:

- extraction prompt and parser
- creation of structured tasks, decisions, blockers, risks, and insights
- confidence scoring on extracted entities
- AI provenance flags on generated records

Primary outcome:

- raw meeting content becomes actionable structured intelligence

## Phase 4. Semantic Memory Layer

Deliver:

- chunking logic
- embedding generation
- storage in pgvector
- similarity and keyword search endpoints

Primary outcome:

- the system can answer retrieval-style operational questions

## Phase 5. Executive Briefings

Deliver:

- daily or on-demand briefing generation
- aggregation of unresolved tasks, blockers, and risks
- traceable lineage to the source entities used to generate the briefing
- storage of generated briefing artifacts

Primary outcome:

- leadership gets a usable summary instead of raw fragmented updates

## Phase 6. Dashboard Surface

Deliver:

- meetings list
- task and blocker views
- semantic search view
- executive briefing view

Primary outcome:

- the system becomes usable without direct database inspection

---

# Suggested Netlify Function Surface

Suggested first endpoints:

- POST /api/ops-meeting-ingest
- GET /api/ops-meetings
- GET /api/ops-meeting/:id
- GET /api/ops-search
- GET /api/ops-briefing/daily

Suggested architecture-ready expansion:

- POST /api/ops-source-ingest
- GET /api/ops-sources
- GET /api/ops-insights

These do not need full Google Workspace sync at first.

---

# Success Criteria For MVP

The MVP is successful if it can do all of the following:

- ingest one meeting note end-to-end
- extract tasks, decisions, blockers, risks, and insights
- make the meeting searchable by meaning and keywords
- generate a useful executive briefing from stored history
- show the result in a simple internal dashboard

---

# Architectural Notes

The system should remain:

- MVP-friendly
- relational-first
- semantically searchable
- operationally practical
- extensible to future source types

Avoid:

- workflow engines
- deep hierarchy systems
- excessive normalization
- abstractions that make the MVP harder to ship
