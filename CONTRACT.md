# API Contract

The agreement between the FastAPI backend and the React frontend. If an endpoint's shape changes, update this file in the same PR.

Request and response shapes come from the Pydantic models in [Backend/app/models.py](Backend/app/models.py). Those models are the source of truth. If this file and the models disagree, the models win, and this file should be fixed. The [Shapes](#shapes) section below lists every field.

Vamsi's endpoints don't have models yet, so their shapes in the table are still placeholders.

## Endpoints

| Method | Path | Owner | Request body | Returns | Notes |
|---|---|---|---|---|---|
| GET | `/feed?category=` | Vamsi | — | `200` list of listings | `category` is optional; omit it for all categories. |
<<<<<<< HEAD
| GET | `/skills` | Vamsi | — | `200` list of skills | Requires authentication; returns the selectable skill IDs, labels, and categories. |
| GET | `/listings/{id}` | Vamsi | — | `200` one listing | `404` if the listing doesn't exist. |
| POST | `/listings` | Vamsi | `{ title, description, category }` | `201` the created listing | Owner is taken from the JWT, not the body. |
=======
| GET | `/listings/{id}` | Vamsi | — | `200` `ListingOut` | `404` if the listing doesn't exist. Carries `meet_spot`, `mode` and `available_when`. |
| POST | `/listings` | Vamsi | `ListingIn` | `201` `ListingOut` | Owner is taken from the JWT, not the body. `meet_spot`, `mode` and `available_when` are optional; `mode` must be exactly `"in_person"` or `"online"`. `400` if `category` isn't a known skill id. |
>>>>>>> e13a31ac52a5c304b2188da547b6a3859c0dc118
| POST | `/wants` | Vamsi | `{ title, description, category }` | `201` the created want | Owner is taken from the JWT. Wants feed into matching. |
| GET | `/me` | Vamsi | — | `200` my profile, rank, stats | The profile of whoever the JWT belongs to. |
| GET | `/profiles/{id}` | Vamsi | — | `200` profile with reviews | `404` if the user doesn't exist. |
| GET | `/notifications` | Vamsi | — | `200` `{ unread: number }` | Unread count only. |
| GET | `/matches` | Abhyuday | — | `200` `MatchOut[]` | Sorted by `score`, best first. Excludes the caller. |
| POST | `/exchanges` | Abhyuday | `ExchangeIn` | `201` `ExchangeOut` | The requester is taken from the JWT. Starts in `proposed`. `400` if `recipient_id` is yourself or `source` isn't `"browse"` or `"match"`. |
| GET | `/exchanges/{id}` | Abhyuday | — | `200` `ExchangeOut` | `403` if you aren't the `requester` or `recipient`. `404` if it doesn't exist. |
| GET | `/exchanges/mine` | Abhyuday | — | `200` `LedgerOut` | Each of the four keys is an `ExchangeSummary[]`. Register this route before `/exchanges/{id}` so `mine` isn't read as an id. |
| POST | `/exchanges/{id}/respond` | Abhyuday | `RespondIn` | `200` `ExchangeOut` | Recipient only (`403` otherwise). `action: "accept"` → `accepted`, `action: "decline"` → `declined`. `400` for any other `action`. `409` if the exchange isn't `proposed`. |
| POST | `/exchanges/{id}/lock` | Abhyuday | — | `200` `ExchangeOut` | Freezes the terms. `accepted` → `locked` and sets `locked_at`. `409` from any other status. |
| POST | `/exchanges/{id}/complete` | Abhyuday | — | `200` `ExchangeOut` | Sets the caller's `requester_completed` or `recipient_completed` to `true`. Status stays `locked` until both are `true`, then moves to `completed`. `409` if the exchange isn't `locked`. |
| POST | `/reviews` | Abhyuday | `ReviewIn` | `201` `ReviewOut` | The reviewer is taken from the JWT. Only for a `completed` exchange you were part of. `409` if you've already reviewed it. |

## Shapes

These mirror [Backend/app/models.py](Backend/app/models.py). `?` marks an optional field that may be `null`. Timestamps (`created_at`, `locked_at`) are strings.

### Requests

**`ListingIn`**: body of `POST /listings`

```
{
  title:           string               // 1-120 chars
  description:     string               // 1-2000 chars, stored as listings.detail
  category:        string               // a skill id, e.g. "CALCULUS_TUTORING"
  meet_spot?:      string | null        // max 120 chars, e.g. "JPL library, 2nd floor"
  mode?:           string | null        // exactly "in_person" or "online"
  available_when?: string | null        // max 120 chars
}
```

`category` is a **skill id** (`skills.id`), not the human category. The response's
`category` is that skill's `skills.category`, e.g. `"tutoring"`.

Date and time go together as **one string** in `available_when`, for example
`"Thu 9 Oct, 6:00 PM"`. There is no separate date or time field.

The three new fields are optional; omitting them, or sending `null`, stores `NULL`.
Any `mode` other than `"in_person"` or `"online"` is a `422`.

**`ExchangeIn`**: body of `POST /exchanges`

```
{
  recipient_id:         string
  requester_listing_id: string
  recipient_listing_id: string
  terms:                TermsIn
  source:               string     // "browse" or "match"
}
```

**`TermsIn`**: used inside `ExchangeIn` and `ExchangeOut`

```
{
  requester_gives: string
  recipient_gives: string
  when:            string
  where:           string
  mode:            string
  note?:           string | null
}
```

**`RespondIn`**: body of `POST /exchanges/{id}/respond`

```
{
  action:  string            // "accept" or "decline"
  reason?: string | null
}
```

**`ReviewIn`**: body of `POST /reviews`

```
{
  exchange_id: string
  stars:       int
  note?:       string | null
}
```

### Responses

<<<<<<< HEAD
**`Skill`**: one selectable skill from `GET /skills`

```
{
  id:       string
  label:    string
  category: string
=======
**`ListingOut`**: one listing, returned by `POST /listings` and `GET /listings/{id}`

```
{
  id:              string
  title:           string
  description:     string
  category:        string               // the skill's category, e.g. "tutoring"
  skill_id:        string               // e.g. "CALCULUS_TUTORING"
  meet_spot?:      string | null
  mode?:           string | null        // "in_person" or "online"
  available_when?: string | null
  owner?:          PersonRef            // included by GET /listings/{id}
>>>>>>> e13a31ac52a5c304b2188da547b6a3859c0dc118
}
```

**`ExchangeOut`**: one exchange, full detail

```
{
  id:                  string
  status:              string     // see Exchange status
  created_at:          string
  source:              string     // "browse" or "match"
  requester:           PersonRef
  recipient:           PersonRef
  terms:               TermsIn
  locked_at?:          string | null
  requester_completed: bool
  recipient_completed: bool
  thread_id?:          string | null
}
```

**`LedgerOut`**: response of `GET /exchanges/mine`

```
{
  incoming: ExchangeSummary[]
  pending:  ExchangeSummary[]
  active:   ExchangeSummary[]
  closed:   ExchangeSummary[]
}
```

**`ExchangeSummary`**: one row in the ledger

```
{
  id:         string
  status:     string
  other:      PersonRef          // the other party, not you
  summary:    string
  created_at: string
}
```

**`MatchOut`**: one scored match

```
{
  user_id:    string
  name:       string
  file_code?: string | null
  score:      int
  mutual:     bool
  they_give:  SkillRef
  you_give:   SkillRef
  breakdown:  Breakdown
}
```

**`ReviewOut`**: one review

```
{
  id:          string
  exchange_id: string
  reviewer:    PersonRef
  stars:       int
  note?:       string | null
  created_at:  string
}
```

### Shared

**`PersonRef`**

```
{
  id:         string
  name:       string
  file_code?: string | null
}
```

**`SkillRef`**

```
{
  skill_id: string
  label:    string
}
```

**`Breakdown`**

```
{
  skills:   int
  timing:   int
  location: int
}
```

## Auth

Every request sends:

```
Authorization: Bearer <supabase jwt>
```

The backend verifies the token with `SUPABASE_JWT_SECRET` and takes the user id from it. A missing, invalid or expired token returns `401`.

## Error shape

Every error except `422` returns:

```json
{ "detail": "message" }
```

This is FastAPI's default `HTTPException` output. `detail` is a string you can show to the user as is.

### 422: validation failed

FastAPI returns `422` on its own when a request body doesn't match the Pydantic model, for example a missing field or a wrong type. For `422` only, `detail` is a **list of error objects**, not a string:

```json
{
  "detail": [
    { "type": "missing", "loc": ["body", "terms", "when"], "msg": "Field required", "input": { } }
  ]
}
```

On the frontend:

- **`422`:** show a generic message such as "Something was wrong with that request." Don't render `detail` directly.
- **Every other error:** show `detail` directly.

## Status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created (any POST that creates a new row) |
| `400` | Bad request: the body is well formed, but a value isn't allowed (for example, proposing to yourself or an unknown `action`) |
| `401` | No valid JWT |
| `403` | Valid JWT, but you aren't allowed to do this |
| `404` | Not found |
| `409` | Conflict: the action doesn't fit the current state (for example, locking an exchange that isn't accepted) |
| `422` | Validation failed: the body doesn't match the model. `detail` is a list, not a string (see [422: validation failed](#422-validation-failed)) |

## Exchange status

An exchange is always in exactly one of these five states:

| Status | Meaning |
|---|---|
| `proposed` | Sent, waiting for the recipient to respond |
| `accepted` | Recipient agreed; terms can still be discussed |
| `locked` | Terms are frozen; waiting for both sides to confirm completion |
| `completed` | Both sides confirmed; reviews are open |
| `declined` | Recipient said no (final) |

```
proposed ──► accepted ──► locked ──► completed
    │
    └──────► declined
```

## Not part of the API

These go from the browser directly to Supabase and never reach the backend:

- **Login**
- **Signup**
- **Chat**
