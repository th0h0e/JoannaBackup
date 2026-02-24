# Zed Agent Architecture & ACP Integration Research

> Research findings for building an OpenCode extension that achieves feature parity with Zed's native agent.

## Executive Summary

Zed uses a **trait-based capability system** where the `AgentConnection` trait defines all available features. The native Zed agent implements ALL capabilities, while external ACP agents only support what the ACP protocol exposes. This document identifies the gaps and provides a roadmap for closing them.

---

## Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zed Editor UI                            │
│                    (queries AgentConnection)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              AgentConnection Trait                               │
│              (crates/acp_thread/src/connection.rs)              │
│                                                                 │
│  • supports_load_session()                                      │
│  • supports_resume_session()                                    │
│  • truncate() → Option<Rc<dyn AgentSessionTruncate>>           │
│  • retry() → Option<Rc<dyn AgentSessionRetry>>                 │
│  • model_selector() → Option<Rc<dyn AgentModelSelector>>       │
│  • session_modes() → Option<Rc<dyn AgentSessionModes>>         │
│  • session_list() → Option<Rc<dyn AgentSessionList>>           │
│  • telemetry() → Option<Rc<dyn AgentTelemetry>>                │
│  • ... more methods                                             │
└─────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│   NativeAgentConnection      │  │      AcpConnection           │
│   (crates/agent/src/agent.rs)│  │ (crates/agent_servers/       │
│                              │  │       src/acp.rs)            │
│   Implements ALL methods     │  │                              │
│   ↓                          │  │ Implements based on ACP      │
│   • SQLite persistence       │  │ agent_capabilities           │
│   • Git checkpoints          │  │                              │
│   • Full model registry      │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## Key Files Reference

### Zed Source Code

| File               | GitHub Link                                                                                                                                           | Purpose                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `connection.rs`    | [acp_thread/src/connection.rs](https://github.com/zed-industries/zed/blob/main/crates/acp_thread/src/connection.rs)                                   | `AgentConnection` trait - defines ALL capabilities |
| `agent.rs`         | [agent/src/agent.rs](https://github.com/zed-industries/zed/blob/main/crates/agent/src/agent.rs)                                                       | Native agent with full capability implementation   |
| `acp.rs`           | [agent_servers/src/acp.rs](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs)                                           | ACP connection - maps protocol to capabilities     |
| `acp_thread.rs`    | [acp_thread/src/acp_thread.rs](https://github.com/zed-industries/zed/blob/main/crates/acp_thread/src/acp_thread.rs)                                   | Checkpoint implementation, thread management       |
| `thread_store.rs`  | [agent/src/thread_store.rs](https://github.com/zed-industries/zed/blob/main/crates/agent/src/thread_store.rs)                                         | Thread history storage management                  |
| `db.rs`            | [agent/src/db.rs](https://github.com/zed-industries/zed/blob/main/crates/agent/src/db.rs)                                                             | SQLite persistence for thread history              |
| `active_thread.rs` | [agent_ui/src/acp/thread_view/active_thread.rs](https://github.com/zed-industries/zed/blob/main/crates/agent_ui/src/acp/thread_view/active_thread.rs) | UI rendering, checkpoint button                    |

### ACP Protocol

| Resource       | Link                                                                               | Purpose                            |
| -------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| ACP Spec       | [agentclientprotocol.com](https://agentclientprotocol.com)                         | Official protocol specification    |
| Schema         | [protocol/schema](https://agentclientprotocol.com/protocol/schema)                 | JSON-RPC method definitions        |
| TypeScript SDK | [@agentclientprotocol/sdk](https://www.npmjs.com/package/@agentclientprotocol/sdk) | Official TypeScript implementation |
| Rust SDK       | [agent-client-protocol crate](https://crates.io/crates/agent-client-protocol)      | Official Rust implementation       |

---

## Capability Comparison Matrix

### Feature Parity Analysis

| Feature                 | Native Agent | External ACP Agent |      ACP Support      | Priority |
| ----------------------- | :----------: | :----------------: | :-------------------: | :------: |
| Basic conversation      |      ✅      |         ✅         |          ✅           |    -     |
| Tool calls              |      ✅      |         ✅         |          ✅           |    -     |
| File operations         |      ✅      |         ✅         |          ✅           |    -     |
| Terminal support        |      ✅      |         ✅         |          ✅           |    -     |
| **Thread history list** |      ✅      |         ⚠️         |    `session/list`     |   HIGH   |
| **Load saved session**  |      ✅      |         ⚠️         |    `session/load`     |   HIGH   |
| **Resume session**      |      ✅      |         ⚠️         |   `session/resume`    |  MEDIUM  |
| **Model selection**     |      ✅      |         ⚠️         |  In session response  |   HIGH   |
| **Session modes**       |      ✅      |         ⚠️         |  In session response  |  MEDIUM  |
| **Config options**      |      ❌      |         ⚠️         | `SessionConfigOption` |  MEDIUM  |
| **Checkpoints**         |      ✅      |         ❌         |    **NOT IN ACP**     | CRITICAL |
| **Message truncation**  |      ✅      |         ❌         |    **NOT IN ACP**     |   HIGH   |
| **Thread retry**        |      ✅      |         ❌         |    **NOT IN ACP**     |  MEDIUM  |
| **Set thread title**    |      ✅      |         ❌         |    **NOT IN ACP**     |   LOW    |
| **Telemetry**           |      ✅      |         ❌         |    **NOT IN ACP**     |   LOW    |

Legend:

- ✅ = Fully supported
- ⚠️ = Supported if agent advertises capability
- ❌ = Not supported

---

## Deep Dive: Native Agent Implementation

### Session Structure

From [`agent.rs:67-74`](https://github.com/zed-industries/zed/blob/main/crates/agent/src/agent.rs#L67-L74):

```rust
struct Session {
    /// The internal thread that processes messages
    thread: Entity<Thread>,
    /// The ACP thread that handles protocol communication
    acp_thread: Entity<acp_thread::AcpThread>,
    pending_save: Task<()>,
    _subscriptions: Vec<Subscription>,
}
```

The native agent maintains **dual threads**:

1. **Thread** - Internal message processing, tool execution, token tracking
2. **AcpThread** - Protocol-level representation for UI

### Capability Implementation Examples

#### 1. Session Loading

From [`agent.rs:1246-1259`](https://github.com/zed-industries/zed/blob/main/crates/agent/src/agent.rs#L1246-L1259):

```rust
// NativeAgentConnection always supports these
fn supports_load_session(&self) -> bool {
    true
}

fn load_session(
    self: Rc<Self>,
    session: AgentSessionInfo,
    _project: Entity<Project>,
    _cwd: &Path,
    cx: &mut App,
) -> Task<Result<Entity<AcpThread>>> {
    self.0
        .update(cx, |agent, cx| agent.open_thread(session.session_id, cx))
}
```

Compare to ACP connection in [`acp.rs:579-581`](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs#L579-L581):

```rust
fn supports_load_session(&self) -> bool {
    self.agent_capabilities.load_session
}
```

#### 2. Model Selection

From [`agent.rs:1126-1227`](https://github.com/zed-industries/zed/blob/main/crates/agent/src/agent.rs#L1126-L1227):

```rust
impl acp_thread::AgentModelSelector for NativeAgentModelSelector {
    fn list_models(&self, cx: &mut App) -> Task<Result<acp_thread::AgentModelList>> {
        let list = self.connection.0.read(cx).models.model_list.clone();
        Task::ready(Ok(list))
    }

    fn select_model(&self, model_id: acp::ModelId, cx: &mut App) -> Task<Result<()>> {
        // Updates thread model and persists to settings
        thread.update(cx, |thread, cx| {
            thread.set_model(model.clone(), cx);
        });
        // ...
    }

    fn should_render_footer(&self) -> bool {
        true  // Native agent shows provider-specific footer
    }
}
```

#### 3. Checkpoints

From [`acp_thread.rs:67-80`](https://github.com/zed-industries/zed/blob/main/crates/acp_thread/src/acp_thread.rs#L67-L80):

```rust
pub struct UserMessage {
    pub id: Option<UserMessageId>,
    pub content: ContentBlock,
    pub chunks: Vec<acp::ContentBlock>,
    pub checkpoint: Option<Checkpoint>,  // ← Native-only feature
    pub indented: bool,
}

pub struct Checkpoint {
    git_checkpoint: GitStoreCheckpoint,  // Git commit reference
    pub show: bool,
}
```

UI rendering in [`active_thread.rs:3524-3543`](https://github.com/zed-industries/zed/blob/main/crates/agent_ui/src/acp/thread_view/active_thread.rs#L3524-L3543):

```rust
message.checkpoint.as_ref()?.show.then(|| {
    h_flex()
        .child(
            Button::new("restore-checkpoint", "Restore Checkpoint")
                .icon(IconName::Undo)
                .tooltip(Tooltip::text(
                    "Restores all files in the project to the content \
                     they had at this point in the conversation."
                ))
                .on_click(cx.listener(move |this, _, _window, cx| {
                    this.restore_checkpoint(&message_id, cx);
                }))
        )
})
```

---

## Implementation Plan

### Phase 1: Core ACP Enhancements (HIGH PRIORITY)

#### 1.1 Thread Persistence

**Goal:** Enable session history browsing and restoration

**Steps:**

1. **Implement local thread storage**
   - Create SQLite database (similar to Zed's `ThreadsDatabase`)
   - Store: session_id, title, cwd, updated_at, conversation summary

2. **Advertise `session_capabilities.list`** in `initialize` response:

   ```json
   {
     "agentCapabilities": {
       "session_capabilities": {
         "list": { "supports_delete": true }
       }
     }
   }
   ```

3. **Implement `session/list`** method:

   ```json
   // Request
   { "cwd": "/path/to/project" }

   // Response
   {
     "sessions": [
       {
         "session_id": "abc-123",
         "cwd": "/path/to/project",
         "title": "Fix authentication bug",
         "updated_at": "2025-02-24T10:00:00Z"
       }
     ]
   }
   ```

4. **Implement `session/load`** method:

   ```json
   // Request
   {
     "session_id": "abc-123",
     "cwd": "/path/to/project",
     "mcp_servers": [...]
   }

   // Response
   {
     "session_id": "abc-123",
     "modes": { ... },
     "models": { ... }
   }
   ```

   Then stream conversation history via `session/update` notifications.

**Reference:** [`acp.rs:590-656`](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs#L590-L656)

#### 1.2 Model Selection

**Goal:** Allow users to switch models within a session

**Steps:**

1. **Include models in `session/new` response:**

   ```json
   {
     "sessionId": "new-session-id",
     "models": {
       "current_model_id": "claude-sonnet-4",
       "available_models": [
         {
           "model_id": "claude-sonnet-4",
           "name": "Claude Sonnet 4",
           "description": "Best for coding tasks",
           "is_latest": true
         },
         {
           "model_id": "gpt-4-turbo",
           "name": "GPT-4 Turbo"
         }
       ]
     }
   }
   ```

2. **Implement `session/set_model`:**
   - Update internal model selection
   - Return updated model state

**Reference:** [`acp.rs:1027-1077`](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs#L1027-L1077)

---

### Phase 2: Session Modes (MEDIUM PRIORITY)

**Goal:** Support different agent behaviors (ask, code, architect)

**Steps:**

1. **Include modes in `session/new` response:**

   ```json
   {
     "modes": {
       "current_mode_id": "code",
       "available_modes": [
         { "id": "code", "name": "Code", "description": "Write and edit code" },
         { "id": "ask", "name": "Ask", "description": "Answer questions" },
         {
           "id": "architect",
           "name": "Architect",
           "description": "Plan and design"
         }
       ]
     }
   }
   ```

2. **Implement `session/set_mode`:**
   - Switch between modes
   - Adjust tool availability and system prompts

**Reference:** [`acp.rs:966-1005`](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs#L966-L1005)

---

### Phase 3: Config Options (MEDIUM PRIORITY)

**Goal:** Expose thinking mode, effort levels, etc.

**Steps:**

1. **Include config options in session response:**

   ```json
   {
     "configOptions": [
       {
         "id": "thinking_mode",
         "name": "Thinking Mode",
         "kind": {
           "select": {
             "current_value": "enabled",
             "options": [
               { "value": "enabled", "name": "Enabled" },
               { "value": "disabled", "name": "Disabled" }
             ]
           }
         }
       },
       {
         "id": "effort",
         "name": "Effort Level",
         "kind": {
           "select": {
             "current_value": "medium",
             "options": [
               { "value": "low", "name": "Low" },
               { "value": "medium", "name": "Medium" },
               { "value": "high", "name": "High" }
             ]
           }
         }
       }
     ]
   }
   ```

2. **Implement `session/set_config_option`:**
   ```json
   // Request
   {
     "session_id": "...",
     "config_id": "effort",
     "value": "high"
   }
   ```

**Reference:** [`acp.rs:1079-1120`](https://github.com/zed-industries/zed/blob/main/crates/agent_servers/src/acp.rs#L1079-L1120)

---

### Phase 4: Protocol Extensions (REQUIRES ACP CHANGES)

These features are **NOT** currently in the ACP protocol and require either:

1. **Proposal to ACP Working Group** - Add new methods to protocol
2. **Custom `_meta` extensions** - Zed-specific implementation

#### 4.1 Checkpoints

**Current State:** Checkpoints use Zed's `GitStoreCheckpoint` which creates actual git commits. The agent doesn't manage this - Zed does.

**Path Forward:**

- **Option A:** ACP protocol extension for checkpoint management
  - New method: `session/create_checkpoint`
  - New method: `session/restore_checkpoint`
  - Requires agent to understand git state
- **Option B:** `_meta` field extension
  - Include checkpoint info in `session/update` notifications
  - Zed-specific, wouldn't work in other editors

**Recommendation:** This is architecturally challenging. Zed manages git state, not the agent. A proper solution would require the agent to coordinate with the editor's version control system.

#### 4.2 Message Truncation

**Current State:** Native agent can edit any message and resubmit. ACP assumes linear flow.

**Path Forward:**

- Propose `session/truncate` method to ACP working group:
  ```json
  // Request
  {
    "session_id": "...",
    "message_id": "msg-to-truncate-at"
  }
  ```
- Agent must support rolling back internal state to that point

#### 4.3 Thread Retry

**Current State:** Native agent has retry with exponential backoff.

**Path Forward:**

- Propose `session/retry` method:
  ```json
  // Request
  {
    "session_id": "...",
    "message_id": "msg-to-retry"
  }
  ```

---

## ACP Protocol Gaps Summary

| Gap                   | Impact                          | Workaround               | Long-term Solution          |
| --------------------- | ------------------------------- | ------------------------ | --------------------------- |
| No checkpoints        | Can't restore to previous state | None for external agents | Propose to ACP WG           |
| No message truncation | Can't edit/resubmit messages    | None                     | Propose `session/truncate`  |
| No retry mechanism    | Can't retry failed responses    | User must re-prompt      | Propose `session/retry`     |
| No title setting      | Can't rename threads            | Manual in editor         | Propose `session/set_title` |

---

## Testing & Validation

### ACP Logs

Zed provides debugging via `dev: open acp logs` command. This shows JSON-RPC messages between Zed and the agent.

### Capability Verification

When implementing, verify capabilities are correctly advertised:

1. Check `initialize` response includes expected capabilities
2. Verify `session/new` response includes models/modes/config_options
3. Test `session/list` returns sessions
4. Test `session/load` restores conversation

---

## Resources

- [ACP Official Documentation](https://agentclientprotocol.com)
- [ACP TypeScript SDK](https://www.npmjs.com/package/@agentclientprotocol/sdk)
- [Zed External Agents Docs](https://zed.dev/docs/ai/external-agents)
- [OpenCode ACP Support](https://opencode.ai/docs/acp/)
- [ACP Registry](https://agentclientprotocol.com/registry)

---

## Appendix: AgentConnection Trait Definition

From [`connection.rs:30-155`](https://github.com/zed-industries/zed/blob/main/crates/acp_thread/src/connection.rs#L30-L155):

```rust
pub trait AgentConnection {
    fn telemetry_id(&self) -> SharedString;

    fn new_session(
        self: Rc<Self>,
        project: Entity<Project>,
        cwd: &Path,
        cx: &mut App,
    ) -> Task<Result<Entity<AcpThread>>>;

    // Session management
    fn supports_load_session(&self) -> bool { false }
    fn load_session(...) -> Task<Result<Entity<AcpThread>>> { ... }
    fn supports_close_session(&self) -> bool { false }
    fn close_session(...) -> Task<Result<()>> { ... }
    fn supports_resume_session(&self) -> bool { false }
    fn resume_session(...) -> Task<Result<Entity<AcpThread>>> { ... }
    fn supports_session_history(&self) -> bool {
        self.supports_load_session() || self.supports_resume_session()
    }

    // Authentication
    fn auth_methods(&self) -> &[acp::AuthMethod];
    fn authenticate(&self, method: acp::AuthMethodId, cx: &mut App) -> Task<Result<()>>;

    // Core operations
    fn prompt(...) -> Task<Result<acp::PromptResponse>>;
    fn cancel(&self, session_id: &acp::SessionId, cx: &mut App);

    // Optional capabilities (return None if not supported)
    fn retry(&self, ...) -> Option<Rc<dyn AgentSessionRetry>> { None }
    fn truncate(&self, ...) -> Option<Rc<dyn AgentSessionTruncate>> { None }
    fn set_title(&self, ...) -> Option<Rc<dyn AgentSessionSetTitle>> { None }
    fn model_selector(&self, ...) -> Option<Rc<dyn AgentModelSelector>> { None }
    fn telemetry(&self) -> Option<Rc<dyn AgentTelemetry>> { None }
    fn session_modes(&self, ...) -> Option<Rc<dyn AgentSessionModes>> { None }
    fn session_config_options(&self, ...) -> Option<Rc<dyn AgentSessionConfigOptions>> { None }
    fn session_list(&self, ...) -> Option<Rc<dyn AgentSessionList>> { None }

    fn into_any(self: Rc<Self>) -> Rc<dyn Any>;
}
```

---

_Document created: February 24, 2026_
_Last updated: February 24, 2026_
