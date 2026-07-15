# iOS Client View API Requirements Document

This document outlines the REST API endpoints required by the iOS application (`iosApp`) views to replace mock data layers and communicate with the Go backend gateway.

## Implementation Status and API Conventions

These contracts are implemented by the Go `control-gateway` under `/api/v1`. The existing internal `/api/*` routes remain protected by the gateway API-key middleware and are not part of the iOS Storefront contract.

* JSON request and success response fields use `camelCase` and match the current Swift `Codable` models.
* Protected routes require `Authorization: Bearer <accessToken>`.
* Access tokens are HS256 JWTs valid for 15 minutes and contain `sub`, `email`, `userType`, `iss`, `aud`, `jti`, `iat`, and `exp` claims.
* Opaque refresh tokens are valid for 30 days. Only their SHA-256 hashes are stored in `sessions.hash`; every refresh rotates and soft-deletes the previous session, so replay returns `401`.
* Error responses use `{ "error": "safe message" }` with status `400`, `401`, `403`, `404`, `409`, or `503`. Provider, database, card-token, and credential details are never returned.
* `STOREFRONT_API_ENABLED` defaults to `false`. When disabled, the `/api/v1` Storefront routes are not registered.

---

## 1. Authentication & Profile Modules (`Login/`, `Profile/`)

The authentication module handles securing the client, managing user sessions, and retrieving user profiles.

### Screens & Features:
* **Login View** (`LoginView.swift`): Traditional password entry and Firebase Social Auth options.
* **Profile View** (`ProfileView.swift`): Displays personal details, email, and user type.

### Required API Endpoints:

#### 1. Traditional Credentials Login
* **Route**: `POST /api/v1/auth/login`
* **Purpose**: Authenticate email/password through Firebase Identity Toolkit, synchronize the Prisma `users` record, and issue Go-owned session tokens. Go does not validate or write `users.password`.
* **Payload (JSON)**:
  ```json
  {
    "email": "user@example.com",
    "password": "secure_password"
  }
  ```
* **Response (JSON)**:
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "d8f9a2...",
    "expiresIn": 900
  }
  ```

#### 2. Firebase SSO Validation
* **Route**: `POST /api/v1/auth/firebase`
* **Purpose**: Verify a Firebase ID token through Firebase Identity Toolkit, synchronize the Prisma `users` record, and issue Go-owned session tokens.
* **Payload (JSON)**:
  ```json
  {
    "idToken": "firebase_id_token_string"
  }
  ```
* **Response (JSON)**: Same as Credentials Login (`AuthTokenResponse`).

#### 3. Refresh Access Token
* **Route**: `POST /api/v1/auth/refresh`
* **Purpose**: Rotate the opaque refresh token and issue a new access JWT. A token can be used only once; replaying the old token returns `401`.
* **Payload (JSON)**:
  ```json
  {
    "refreshToken": "refresh_token_string"
  }
  ```
* **Response (JSON)**: Same as Credentials Login (`AuthTokenResponse`), including a new `refreshToken`.

#### 4. Fetch Current Profile
* **Route**: `GET /api/v1/auth/me`
* **Authorization**: JWT required.
* **Response (JSON)**:
  ```json
  {
    "id": "user-uuid-1",
    "email": "user@example.com",
    "phone": "+84900000000",
    "socialId": "firebase-local-id",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "photoUrl": "https://cdn.example.com/avatar.jpg",
    "userType": "individual",
    "createdAt": "2026-07-14T10:00:00Z",
    "updatedAt": "2026-07-14T10:00:00Z"
  }
  ```

#### 5. Fetch Users List (Admin / Dev panels)
* **Route**: `GET /api/v1/users`
* **Authorization**: JWT required and `userType` must equal `admin`; other authenticated users receive `403`.
* **Purpose**: Retrieve user details to populate administrative lists.
* **Response (JSON)**:
  ```json
  [
    {
      "id": "user-uuid-1",
      "email": "user@example.com",
      "phone": "+84900000000",
      "fullName": "John Doe",
      "userType": "individual",
      "createdAt": "2026-07-14T10:00:00Z",
      "updatedAt": "2026-07-14T10:00:00Z"
    }
  ]
  ```

---

## 2. Storefront & Discovery Modules (`Home/`, `Discovery/`)

Discovery views show curated content, collections of mini-apps, and personalized recommendations to drive user engagement.

### Screens & Features:
* **Featured App Card** (`ForYouView.swift`): Main spotlight visual banner.
* **Apps We Love Section** (`DiscoveryAppsWeLoveView.swift`): Smaller curated icon grids.
* **Curated Collections** (`CollectionDetailView.swift`): Category details displaying list of apps.
* **Personalized Section** (`HomePersonalizedSectionView.swift`): Feed adapted to user habits.

### Required API Endpoints:

#### 1. Get Featured App
* **Route**: `GET /api/v1/discovery/featured`
* **Purpose**: Fetch the hero/spotlight card for the Store home.
* **Response (JSON)**:
  ```json
  {
    "id": "featured-id-1",
    "processedId": "mini-app-slug",
    "badge": "RECOMMENDED",
    "title": "Crypto Dashboard",
    "subtitle": "Track and trade in 3D views",
    "backgroundImageUrl": "https://cdn.lepos.ai/assets/banners/featured.jpg",
    "app": {
      "id": "crypto-dashboard-id",
      "name": "Crypto Dashboard",
      "iconUrl": "https://cdn.lepos.ai/assets/icons/crypto.png",
      "category": "Finance",
      "rating": 4.9,
      "developer": "Antigravity Labs",
      "price": "Free"
    }
  }
  ```

#### 2. Get Apps We Love
* **Route**: `GET /api/v1/discovery/apps-we-love`
* **Purpose**: Retrieve the curated array of loved apps.
* **Response (JSON)**: `[]MiniApp` (Array of mini-app details).

#### 3. Get Curated Collections
* **Route**: `GET /api/v1/discovery/collections`
* **Purpose**: Display a deterministic read model derived from published bundles grouped by category. No `app_collections` table is created.
* **Response (JSON)**:
  ```json
  [
    {
      "id": "collection-1",
      "name": "Trading Essentials",
      "subtitle": "Widgets you need for daily positions",
      "coverImageUrl": "https://cdn.lepos.ai/assets/covers/trading.jpg",
      "apps": [ ... ]
    }
  ]
  ```

#### 4. Get Personalized Recommendations
* **Route**: `GET /api/v1/discovery/personalized`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Purpose**: Prefer categories from the authenticated user's install history, then editor choices, ranking score, rating, and download count. Installed bundles are excluded.
* **Response (JSON)**: `[]MiniApp` (Tailored suggestions).

---

## 3. Mini App Catalog & Details (`Store/`, `MiniAppDetails/`)

Manages the core catalog browser, metadata views, asset download triggers, statistics, and coupon promotions.

### Screens & Features:
* **Mini App Store List** (`MiniAppStoreView.swift`): Scrollable lists of catalog contents.
* **Mini App Details View** (`MiniAppDetailsView.swift`): Displays comprehensive screenshots, ratings, release notes, and install triggers.

### Required API Endpoints:

#### 1. Fetch Store Catalog
* **Route**: `GET /api/v1/bundles`
* **Purpose**: Query non-deleted bundles with catalog status `published`. Responses include Swift-compatible `screenshots`, `tags`, `languages`, and `inAppPurchases` arrays; tags expose `name`/`slug`, and every language includes `isDefault`.
* **Response (JSON)**:
  ```json
  [
    {
      "id": "crypto-terminal",
      "name": "Crypto Terminal",
      "version": "1.2.0",
      "buildNumber": 12,
      "iconUrl": "https://cdn.lepos.ai/assets/icons/crypto.png",
      "bannerUrl": "https://cdn.lepos.ai/assets/banners/crypto.jpg",
      "shortDescription": "Real-time order books interface",
      "description": "An advanced trading interface designed...",
      "developerName": "Antigravity Labs",
      "category": "Trading",
      "storagePath": "/bundles/crypto-terminal-v1.2.0.zip",
      "bucket": "lepoship-production",
      "fileSize": 4589201,
      "isFree": true,
      "status": "published",
      "rating": 4.8,
      "ratingCount": 154,
      "createdAt": "2026-07-01T00:00:00Z",
      "updatedAt": "2026-07-14T00:00:00Z"
    }
  ]
  ```

#### 2. Get Secured Download Path
* **Route**: `GET /api/v1/bundles/:id/download-url`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Purpose**: Resolve the `production` channel's current `active` release and request a 15-minute S3/R2-compatible presigned URL for its `full` artifact. The API never returns an `s3://` URI; missing signer configuration returns `503`.
* **Response (JSON)**:
  ```json
  {
    "downloadUrl": "https://artifacts.example.com/lepoship/crypto-terminal-v1.2.0.zip?X-Amz-Signature=..."
  }
  ```

#### 3. Fetch Detail Ratings & Stats
* **Route**: `GET /api/v1/bundles/:id/stats`
* **Purpose**: Display deep statistics and ratings details.
* **Response (JSON)**:
  ```json
  {
    "totalDownloads": 12500,
    "activeInstalls": 9800,
    "averageRating": 4.8,
    "totalRatings": 154
  }
  ```

#### 4. Fetch Promotion Details
* **Route**: `GET /api/v1/bundles/:id/promotions`
* **Purpose**: Retrieve active promotional discount codes.
* **Response (JSON)**:
  ```json
  [
    {
      "id": "promo-uuid-1",
      "bundleId": "bundle-uuid",
      "code": "LAUNCH50",
      "discountPercent": 50.0,
      "maxUses": 100,
      "currentUses": 45,
      "expiresAt": "2026-07-21T17:00:00Z",
      "isActive": true
    }
  ]
  ```

#### 5. Track Download Event
* **Route**: `POST /api/v1/bundles/:id/download/track`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Purpose**: Register download completions on the backend.
* **Response (JSON)**: `{}` (Status 200 OK).

---

## 4. Reviews & Feedback Module (`Reviews/`)

Manages client feedback submissions and ratings lists displayed under each mini-app description.

### Screens & Features:
* **All Reviews View** (`AllReviewsView.swift`): Scrollable lists of ratings and descriptions.
* **Write Review Sheet** (`WriteReviewView.swift`): Form sheet to post a new review.

### Required API Endpoints:

#### 1. Fetch Bundle Reviews
* **Route**: `GET /api/v1/bundles/:id/reviews`
* **Purpose**: List user reviews for a specific mini-app.
* **Response (JSON)**:
  ```json
  [
    {
      "id": "review-uuid-1",
      "author": "EcoFan99",
      "rating": 5,
      "date": "2026-07-12T15:30:00Z",
      "title": "Life changing!",
      "content": "This app has completely changed how I view my daily habits."
    }
  ]
  ```

#### 2. Submit New Review
* **Route**: `POST /api/v1/bundles/:id/reviews`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Identity rule**: The review author always comes from the authenticated JWT user. A client-provided `nickname`, if present for backward compatibility, is ignored.
* **Payload (JSON)**:
  ```json
  {
    "rating": 5,
    "title": "Incredible tools",
    "content": "Very stable and accurate analytics."
  }
  ```
* **Response (JSON)**: `{ "status": "submitted", "reviewId": "new-review-uuid" }`
* **Conflict**: A user may review a bundle only once; duplicates return `409`.

#### 3. Report a Review
* **Route**: `POST /api/v1/reviews/:id/reports`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Payload (JSON)**:
  ```json
  {
    "reason": "spam",
    "description": "Repeated promotional content."
  }
  ```
* **Response (JSON)**: `{ "status": "submitted", "reportId": "new-report-uuid" }`
* **Conflict**: A user may report the same review only once; duplicates return `409`.

---

## 5. Checkout & Payment Licensing Module (`Checkout/`, `Payment/`, `Wallet/`)

Processes license generation for paid applications and handles linked user wallets/cards.

These endpoints are sandbox-only and require `STOREFRONT_MOCK_PAYMENTS_ENABLED=true`. When the flag is disabled they return `503`. Payment methods are deterministic, non-persistent fixtures; card tokens are never stored or logged.

### Screens & Features:
* **Checkout Screen** (`CheckoutView.swift`): Tax calculations and pay authorization buttons.
* **Payment Methods Screen** (`PaymentMethodsView.swift`): Credit card management list.
* **Connect Wallet Screen** (`ConnectWalletView.swift`): Links crypto credentials.

### Required API Endpoints:

#### 1. Process Checkout
* **Route**: `POST /api/v1/payment/checkout`
* **Headers**:
  * `Authorization: Bearer <accessToken>`
  * `Idempotency-Key: <unique-client-operation-id>` (required, maximum 255 characters)
* **Payload (JSON)**:
  ```json
  {
    "bundleId": "portfolio-hub",
    "paymentMethodId": "mock_card_4242"
  }
  ```
* **Response (JSON)**:
  ```json
  {
    "transactionId": "order-uuid",
    "status": "success",
    "receiptUrl": "mock://receipts/order-uuid"
  }
  ```
* **Persistence**: In one PostgreSQL transaction, the backend creates a completed `bundle_orders` row, a sanitized `bundle_payment_logs` row, and upserts an active `bundle_user_entitlements` row. Retrying the same user/key returns the original order without duplicate writes; failures roll back the entire transaction.

#### 2. Fetch User Payment Methods
* **Route**: `GET /api/v1/payment/methods`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Response (JSON)**:
  ```json
  [
    {
      "id": "mock_card_4242",
      "type": "credit_card",
      "brand": "Visa",
      "last4": "4242",
      "isDefault": true
    }
  ]
  ```

#### 3. Save Payment Card
* **Route**: `POST /api/v1/payment/methods`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Payload (JSON)**:
  ```json
  {
    "cardToken": "tok_visa_4242"
  }
  ```
* **Response (JSON)**: `{ "status": "saved", "id": "mock_card_4242" }`
* **Persistence**: The token is syntax-validated for the `tok_` sandbox prefix and discarded after the request. No `payment_methods` table is used.

---

## 6. Notifications & System Alerts Module (`Notifications/`)

Provides inbox listings for system alerts, security audits, and bundle updates.

### Screens & Features:
* **Notifications Inbox** (`NotificationInboxView.swift`): System updates and license notifications.

### Required API Endpoints:

#### 1. Fetch Notification Feed
* **Route**: `GET /api/v1/notifications`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Response (JSON)**:
  ```json
  [
    {
      "id": "notif-uuid-1",
      "title": "Security Update",
      "body": "Crypto Terminal v1.2.0 contains security patches.",
      "type": "bundle_update",
      "isRead": false,
      "createdAt": "2026-07-14T09:00:00Z"
    }
  ]
  ```

#### 2. Mark Notification as Read
* **Route**: `POST /api/v1/notifications/:id/read`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Response (JSON)**: `{}` (Status 200 OK).
* **Ownership rule**: Only the notification recipient can mark it as read. Unknown or another user's notification returns `404` without revealing ownership.

---

## 7. Updates & Storage Management Module (`Updates/`, `Library/`)

Batch checks bundle assets for live OTA version updates.

### Screens & Features:
* **Updates Screen** (`UpdatesView.swift`): Lists downloadable updates for installed mini-apps.

### Required API Endpoints:

#### 1. Check Available Updates (Batch query)
* **Route**: `POST /api/v1/bundles/check-updates`
* **Headers**: `Authorization: Bearer <accessToken>`
* **Selection rule**: Resolve only the `production` channel's current release with release status `active`; `published` is a bundle catalog status and is not a valid release status.
* **Payload (JSON)**:
  ```json
  [
    {
      "bundleId": "crypto-terminal",
      "currentVersion": "1.1.0",
      "currentBuildNumber": 10
    }
  ]
  ```
* **Response (JSON)**:
  ```json
  [
    {
      "bundleId": "crypto-terminal",
      "updateAvailable": true,
      "latestVersion": "1.2.0",
      "latestBuildNumber": 12,
      "changelog": "Performance improvements and bug fixes.",
      "downloadUrl": "https://artifacts.example.com/lepoship/crypto-terminal-v1.2.0.zip?X-Amz-Signature=..."
    }
  ]
  ```
* **Signing**: An available update receives a 15-minute presigned HTTP(S) URL for the `full` artifact. Missing signer configuration returns `503`; an `s3://` URL is never returned.
* **No update**: `updateAvailable` is `false`, `downloadUrl` is `null`, and the latest/current version fields remain present.

---

## 8. Runtime Flags and Failure Behavior

### Configuration Inputs

| Variable | Default / purpose |
|---|---|
| `STOREFRONT_API_ENABLED` | `false`; registers the Storefront routes when enabled. |
| `STOREFRONT_MOCK_PAYMENTS_ENABLED` | `false`; enables sandbox payment fixtures and transactional mock checkout. |
| `FIREBASE_API_KEY` | Firebase Identity Toolkit API key used by both login flows. |
| `STOREFRONT_JWT_SECRET` | HS256 signing key; must contain at least 32 bytes. |
| `STOREFRONT_JWT_ISSUER` | `control-gateway`. |
| `STOREFRONT_JWT_AUDIENCE` | `ios-storefront`. |
| `STOREFRONT_ACCESS_TTL` | `15m`. |
| `STOREFRONT_REFRESH_TTL` | `720h` (30 days). |
| `LEPOS_ARTIFACT_ENDPOINT` | Optional S3/R2-compatible endpoint. |
| `LEPOS_ARTIFACT_REGION` | `auto`. |
| `LEPOS_ARTIFACT_ACCESS_KEY_ID` | Artifact signer access-key identifier. |
| `LEPOS_ARTIFACT_SECRET_ACCESS_KEY` | Artifact signer secret; never expose it to the client. |
| `LEPOS_ARTIFACT_FORCE_PATH_STYLE` | `false`; enable for compatible providers that require path-style URLs. |

### Failure Behavior

| Condition | Behavior |
|---|---|
| `STOREFRONT_API_ENABLED=false` | Storefront `/api/v1` routes are not registered. |
| `STOREFRONT_MOCK_PAYMENTS_ENABLED=false` | Payment methods and checkout return `503`. |
| Firebase API key unavailable | Login endpoints return `503`; provider details are not exposed. |
| JWT secret missing or shorter than 32 bytes | Token issuance and protected-route verification return `503`. |
| Artifact credentials/signer unavailable | Download URL and update signing return `503`; public catalog endpoints remain available. |
| Missing/invalid Bearer token | Protected endpoint returns `401`. |
| Authenticated non-admin calls `/users` | Endpoint returns `403`. |
| Duplicate review/report | Endpoint returns `409`. |

The Go service reads the existing Prisma-managed tables directly and does not run `AutoMigrate`. It does not create `app_collections`, `payment_methods`, or `refresh_tokens` tables.
