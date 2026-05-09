# README_DATABASE.md

# Executive Operations Database Architecture

## Overview

This database is designed to support an AI-augmented executive operations system.

The architecture should be thought of as:

sources
↓
entities
↓
chunks
↓
intelligence

The database stores:

- organizational memory
- meetings
- people
- tasks
- AI-generated intelligence
- semantic embeddings
- executive briefings
- multi-source operational records

The system should eventually support ingestion from:

- meetings
- Gmail
- Google Docs
- WhatsApp
- Slack
- transcripts
- manual entries

The architecture is intentionally:

- simple
- composable
- relational-first
- AI-compatible
- operationally practical
- source-agnostic

The database serves two purposes:

## 1. Operational Database

Stores structured business data.

## 2. AI Memory Layer

Stores semantic chunks and embeddings for search and intelligence generation.

---

# Technology

## Database

- Neon Postgres

## Extensions

- pgvector
- pgcrypto

Required setup:

```sql id="eqlj7v"
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

---

# First-Pass Schema

This is the recommended MVP schema.

The first version should prioritize:

- source ingestion with meetings as the first source type
- extraction of decisions, tasks, risks, and blockers
- semantic memory for retrieval
- executive brief generation

The schema should remain meeting-friendly for the MVP while avoiding a design that assumes all future intelligence originates only from meetings.

## Core Tables

### 1. sources

Represents the origin of imported operational data.

Examples:

- Google Meet note
- transcript upload
- Gmail thread
- Google Doc
- WhatsApp export
- Slack thread
- manual entry

Suggested columns:

- id UUID primary key
- organization_id UUID
- source_type TEXT
- external_id TEXT
- title TEXT
- source_url TEXT
- created_by TEXT
- source_created_at TIMESTAMPTZ
- processing_state TEXT
- content_checksum TEXT
- ingested_at TIMESTAMPTZ default now()
- raw_payload JSONB

Constraints:

- unique (source_type, external_id)

### 2. meetings

Primary entity for operational discussions.

Suggested columns:

- id UUID primary key
- organization_id UUID
- source_id UUID references sources(id)
- project_key TEXT
- title TEXT
- meeting_date TIMESTAMPTZ
- summary TEXT
- transcript TEXT
- notes_markdown TEXT
- meeting_type TEXT
- processing_state TEXT
- status TEXT
- content_checksum TEXT
- created_at TIMESTAMPTZ default now()
- updated_at TIMESTAMPTZ default now()

### 3. people

Normalized people directory.

This is intentionally broader than meeting attendance.

It should support:

- founders
- vendors
- clients
- consultants
- external partners
- meeting attendees

Suggested columns:

- id UUID primary key
- organization_id UUID
- full_name TEXT
- email TEXT
- role TEXT
- team TEXT
- created_at TIMESTAMPTZ default now()

Constraints:

- unique (email)

### 4. meeting_people

Join table between meetings and people.

Suggested columns:

- meeting_id UUID references meetings(id)
- person_id UUID references people(id)
- attendance_role TEXT
- primary key (meeting_id, person_id)

### 5. tasks

Operational actions extracted from meetings or added manually.

Suggested columns:

- id UUID primary key
- organization_id UUID
- source_id UUID references sources(id)
- meeting_id UUID references meetings(id)
- project_key TEXT
- title TEXT
- description TEXT
- assignee_person_id UUID references people(id)
- status TEXT
- priority TEXT
- created_by_ai BOOLEAN default false
- due_date TIMESTAMPTZ
- created_at TIMESTAMPTZ default now()
- updated_at TIMESTAMPTZ default now()
- completed_at TIMESTAMPTZ

### 6. decisions

Tracks explicit decisions made in meetings.

Suggested columns:

- id UUID primary key
- organization_id UUID
- meeting_id UUID references meetings(id)
- source_id UUID references sources(id)
- decision_text TEXT
- owner_person_id UUID references people(id)
- decision_date TIMESTAMPTZ
- confidence NUMERIC(5,4)
- created_by_ai BOOLEAN default false
- created_at TIMESTAMPTZ default now()

### 7. risks

Tracks strategic or operational risks.

Suggested columns:

- id UUID primary key
- organization_id UUID
- meeting_id UUID references meetings(id)
- source_id UUID references sources(id)
- project_key TEXT
- title TEXT
- description TEXT
- severity TEXT
- likelihood TEXT
- owner_person_id UUID references people(id)
- status TEXT
- created_by_ai BOOLEAN default false
- created_at TIMESTAMPTZ default now()
- updated_at TIMESTAMPTZ default now()

### 8. blockers

Captures items actively preventing execution.

Suggested columns:

- id UUID primary key
- organization_id UUID
- meeting_id UUID references meetings(id)
- source_id UUID references sources(id)
- project_key TEXT
- description TEXT
- owner_person_id UUID references people(id)
- status TEXT
- created_by_ai BOOLEAN default false
- first_seen_at TIMESTAMPTZ
- resolved_at TIMESTAMPTZ
- created_at TIMESTAMPTZ default now()

### 9. memory_chunks

Semantic retrieval layer. Each chunk is a searchable unit of operational memory.

Suggested columns:

- id UUID primary key
- organization_id UUID
- source_id UUID references sources(id)
- meeting_id UUID references meetings(id)
- project_key TEXT
- entity_type TEXT
- entity_id UUID
- chunk_index INT
- content TEXT
- content_checksum TEXT
- token_count INT
- content_tsv tsvector
- embedding vector(1536)
- metadata JSONB
- created_at TIMESTAMPTZ default now()

Recommended indexes:

- btree on organization_id
- btree on source_id
- btree on meeting_id
- btree on project_key
- gin on content_tsv
- ivfflat or hnsw on embedding

Both keyword search and semantic search should be preserved.

### 10. executive_briefings

Stores generated intelligence artifacts.

Suggested columns:

- id UUID primary key
- organization_id UUID
- briefing_date DATE
- briefing_type TEXT
- title TEXT
- content_markdown TEXT
- source_scope JSONB
- generated_from JSONB
- model_name TEXT
- created_at TIMESTAMPTZ default now()

Constraints:

- unique (briefing_date, briefing_type)

### 11. insights

Stores AI-generated organizational intelligence that does not fit cleanly into tasks, decisions, risks, or blockers.

Use this table for:

- strategic observations
- recurring themes
- execution patterns
- coordination risks
- operational drift
- leadership intelligence

Suggested columns:

- id UUID primary key
- organization_id UUID
- source_id UUID references sources(id)
- meeting_id UUID references meetings(id)
- project_key TEXT
- insight_type TEXT
- title TEXT
- content TEXT
- confidence NUMERIC(5,4)
- importance TEXT
- created_by_ai BOOLEAN default true
- metadata JSONB
- created_at TIMESTAMPTZ default now()

Suggested insight types:

- strategic_theme
- founder_attention
- execution_pattern
- organizational_observation
- coordination_risk
- recurring_issue
- opportunity
- workload_signal

## Recommended Status Values

These should be documented and treated like enum-style constrained application values.

### Tasks

- open
- in_progress
- blocked
- completed
- cancelled

### Risks

- open
- monitoring
- mitigated
- resolved

### Meetings

- pending
- processed
- archived

### Processing State

For sources and meetings:

- pending
- parsed
- extracted
- embedded
- completed
- failed

## Relationship Summary

- one source can create many meetings, tasks, decisions, risks, blockers, memory_chunks, and insights
- one meeting can have many people through meeting_people
- one meeting can produce many tasks, decisions, risks, blockers, memory_chunks, and insights
- one person can own many tasks, decisions, risks, and blockers
- one organization can own many operational records and intelligence records
- executive briefings aggregate across many meetings and entities but remain stored as their own artifact
- insights can be generated from any source type, not only meetings

## Minimal DDL Example

```sql
CREATE TABLE IF NOT EXISTS sources (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_type TEXT NOT NULL,
	external_id TEXT,
	title TEXT,
	source_url TEXT,
	created_by TEXT,
	source_created_at TIMESTAMPTZ,
	processing_state TEXT,
	content_checksum TEXT,
	ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	raw_payload JSONB,
	UNIQUE (source_type, external_id)
);

CREATE TABLE IF NOT EXISTS meetings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	project_key TEXT,
	title TEXT NOT NULL,
	meeting_date TIMESTAMPTZ,
	summary TEXT,
	transcript TEXT,
	notes_markdown TEXT,
	meeting_type TEXT,
	processing_state TEXT,
	status TEXT,
	content_checksum TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS people (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	full_name TEXT,
	email TEXT UNIQUE,
	role TEXT,
	team TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meeting_people (
	meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
	person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
	attendance_role TEXT,
	PRIMARY KEY (meeting_id, person_id)
);

CREATE TABLE IF NOT EXISTS tasks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	project_key TEXT,
	title TEXT NOT NULL,
	description TEXT,
	assignee_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
	status TEXT,
	priority TEXT,
	created_by_ai BOOLEAN NOT NULL DEFAULT false,
	due_date TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS decisions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	decision_text TEXT NOT NULL,
	owner_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
	decision_date TIMESTAMPTZ,
	confidence NUMERIC(5,4),
	created_by_ai BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	project_key TEXT,
	title TEXT NOT NULL,
	description TEXT,
	severity TEXT,
	likelihood TEXT,
	owner_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
	status TEXT,
	created_by_ai BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blockers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	project_key TEXT,
	description TEXT NOT NULL,
	owner_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
	status TEXT,
	created_by_ai BOOLEAN NOT NULL DEFAULT false,
	first_seen_at TIMESTAMPTZ,
	resolved_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_chunks (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	project_key TEXT,
	entity_type TEXT,
	entity_id UUID,
	chunk_index INT NOT NULL,
	content TEXT NOT NULL,
	content_checksum TEXT,
	token_count INT,
	content_tsv tsvector,
	embedding vector(1536),
	metadata JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS executive_briefings (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	briefing_date DATE NOT NULL,
	briefing_type TEXT NOT NULL,
	title TEXT,
	content_markdown TEXT NOT NULL,
	source_scope JSONB,
	generated_from JSONB,
	model_name TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (briefing_date, briefing_type)
);

CREATE TABLE IF NOT EXISTS insights (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id UUID,
	source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
	meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
	project_key TEXT,
	insight_type TEXT NOT NULL,
	title TEXT,
	content TEXT NOT NULL,
	confidence NUMERIC(5,4),
	importance TEXT,
	created_by_ai BOOLEAN NOT NULL DEFAULT true,
	metadata JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memory_chunks_content_tsv_idx
	ON memory_chunks USING GIN (content_tsv);

CREATE INDEX IF NOT EXISTS memory_chunks_embedding_idx
	ON memory_chunks USING HNSW (embedding vector_cosine_ops);
```

## Query Patterns To Support

The schema should make these queries straightforward:

- all tasks created from a meeting
- all decisions related to a topic over time
- unresolved blockers by owner
- repeated risks across meetings
- project-level intelligence retrieval
- organization-level operational patterns
- insights generated from Gmail, Docs, Slack, or manual entries
- semantic retrieval for executive briefing generation
- recent meetings with extracted summaries and action items

## MVP Recommendation

Build in this order:

1. sources
2. meetings
3. people
4. meeting_people
5. tasks
6. decisions
7. risks
8. blockers
9. memory_chunks
10. insights
11. executive_briefings
