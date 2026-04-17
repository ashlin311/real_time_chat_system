-- V1__initial_schema.sql
-- Run by Flyway on first startup (production).
-- Local dev uses ddl-auto=update with Flyway disabled (application-local.properties).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────────────
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(50) NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at  TIMESTAMPTZ,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ── Chat Rooms ───────────────────────────────────────────────────────
CREATE TABLE chat_rooms (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    type       VARCHAR(20) NOT NULL CHECK (type IN ('DIRECT', 'GROUP')),
    created_by UUID        NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active  BOOLEAN     NOT NULL DEFAULT TRUE
);

-- ── Room Members ─────────────────────────────────────────────────────
CREATE TABLE room_members (
    room_id              UUID        NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id              UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    joined_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role                 VARCHAR(20) NOT NULL DEFAULT 'MEMBER'
                         CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    last_read_message_id UUID,
    PRIMARY KEY (room_id, user_id)
);
-- "Get all rooms for user" — common query on app load
CREATE INDEX idx_room_members_user   ON room_members(user_id, joined_at DESC);
-- "Is user a member of room?" — called on every STOMP SEND
CREATE INDEX idx_room_members_lookup ON room_members(room_id, user_id);

-- ── Messages ─────────────────────────────────────────────────────────
-- sequence_num: BIGINT GENERATED ALWAYS AS IDENTITY
-- Used for cursor-based session recovery (client sends last seen sequenceNum on reconnect).
-- Do NOT use OFFSET pagination — it degrades at scale.
CREATE TABLE messages (
    id           UUID        NOT NULL DEFAULT uuid_generate_v4(),
    room_id      UUID        NOT NULL,
    sender_id    UUID        NOT NULL,
    content      TEXT        NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'TEXT'
                 CHECK (content_type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted   BOOLEAN     NOT NULL DEFAULT FALSE,
    sequence_num BIGINT GENERATED ALWAYS AS IDENTITY,
    PRIMARY KEY (id)
);

-- "Get last N messages in room" — most frequent query (chat history scroll)
CREATE INDEX idx_messages_room_time ON messages(room_id, created_at DESC)
    WHERE is_deleted = FALSE;

-- "Get messages after sequenceNum" — session recovery after reconnect
CREATE INDEX idx_messages_room_seq ON messages(room_id, sequence_num)
    WHERE is_deleted = FALSE;

-- ── Refresh Tokens ───────────────────────────────────────────────────
-- Raw token is never stored — only SHA-256 hash.
CREATE TABLE refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, expires_at)
    WHERE revoked_at IS NULL;
