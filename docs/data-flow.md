# Data Flow Diagrams (Mermaid)

## Home Page Data Fetching Flow

```mermaid
flowchart TD
  HP[Home Page Mount] --> UAUTH[useAuth Composable<br/>Get Current User]
  UAUTH --> FHS{Fetch Hosted<br/>Sessions}
  FHS --> FS1["Firestore Query:<br/>sessions collection<br/>where hostId == userId"]
  FS1 --> HOSTSESS[Return Hosted Sessions<br/>Sorted by createdAt DESC]
  UAUTH --> FJS{Fetch Joined<br/>Sessions}
  FJS --> FS2["Firestore Query:<br/>sessions collection<br/>where joinedBy contains userId"]
  FS2 --> JOINSESS[Return Joined Sessions<br/>Sorted by createdAt DESC]
  HOSTSESS --> MERGE[Merge Hosted +<br/>Joined Sessions]
  JOINSESS --> MERGE
  MERGE --> DEDUP[Deduplicate by ID]
  DEDUP --> SORT[Sort All by<br/>createdAt DESC]
  SORT --> TAKE3[Take Top 3<br/>for Display]
  TAKE3 --> DISPSESS[Display Sessions Card]

  HP --> FSQ["Firestore Query:<br/>songs collection<br/>order by artist ASC,<br/>title ASC"]
  FSQ --> ALLSONGS[Fetch All Songs]
  ALLSONGS --> GROUPING["Client-side Grouping:<br/>- Group by artist<br/>- Max 2 per artist<br/>- Max 3 artists<br/>- Max 6 total songs"]
  GROUPING --> DISPSONG[Display Songs Card<br/>Grouped by Artist]
```

## Session Join Flow

```mermaid
flowchart LR
  JP[Join Page] --> PI[PIN Input<br/>4 digits]
  PI --> V[Validate PIN<br/>Length + Format]
  V --> FSQ{Firestore Query<br/>sessions collection<br/>where pin == input}
  FSQ -- PIN not found --> ERR[Inline Error<br/>Parta s tímto<br/>PINem neexistuje]
  ERR --> ARIA[Announce Error<br/>aria-live region]
  ARIA --> PI
  FSQ -- PIN found<br/>Check isActive --> CHECK{isActive<br/>true?}
  CHECK -- false --> ERR
  CHECK -- true --> ADDUSER["Add userId to<br/>session.joinedBy"]
  ADDUSER --> NAV[Navigate to<br/>Session Page<br/>with sessionId]
  NAV --> SP[Session Page<br/>Display Host's Songs]
```

## Session Creation Flow (Home Page Create Dialog)

```mermaid
flowchart LR
  HOME[Home Page] --> BTN["Click ➕<br/>Create Session"]
  BTN --> DIALOG[Create Session Dialog<br/>Input Session Name]
  DIALOG --> INPUT[User Enters Name]
  INPUT --> SUBMIT[Submit Button]
  SUBMIT --> VALIDATE{Name<br/>Provided?}
  VALIDATE -- Empty --> SHOW_ERR[Show Validation Error]
  SHOW_ERR --> INPUT
  VALIDATE -- Valid --> GEN_PIN[Generate 4-digit<br/>Random PIN]
  GEN_PIN --> WRITE["Write to Firestore<br/>sessions collection"]
  WRITE --> DOC["Document Schema:<br/>{name, hostId,<br/>hostDisplayName,<br/>isActive: true,<br/>pin, joinedBy: [],<br/>createdAt}"]
  DOC --> SUCCESS[Show Success<br/>Message]
  SUCCESS --> CLOSE[Close Dialog]
  CLOSE --> REFRESH[Refresh Sessions List<br/>on Home Page]
  REFRESH --> DISPLAY[Display New Session<br/>in Top 3]
```

## Authentication Flow

```mermaid
flowchart TB
  START[User Access] --> CK{Check Auth State<br/>useAuth in Guard}
  CK -- Not Authenticated --> RT{Route Type}
  RT -- Protected --> LOGIN[Redirect to Login]
  RT -- Public<br/>Join/Session --> ALLOW[Allow Access]
  LOGIN --> LP[Login Page]
  LP --> EM[Enter Email/Password<br/>Email looks like<br/>user@mars.local]
  EM --> FA[Firebase Auth]
  FA -- Success --> AS[useAuth State<br/>Updated]
  FA -- Error --> ERRMSG[Display Error<br/>Invalid Credentials]
  ERRMSG --> EM
  AS --> NAV2[Navigate to Home]
  CK -- Authenticated --> HOME[Access Protected Pages]
```

## Host Authentication (Email/Password)

```mermaid
flowchart LR
  L[Login Form] --> V[Validate Email<br/>+ Password]
  V --> AS[authService<br/>signInWithEmail]
  AS --> FA[Firebase Auth]
  FA -- Success --> UA[useAuth Composable<br/>Update user state]
  UA --> RG[Router Guard<br/>beforeEach]
  RG --> HOME[Navigate to Home]
  FA -- Error --> E[Display Error<br/>Message]
```

## Real-time Voting Flow

```mermaid
flowchart LR
  SPV[Session Page<br/>Song Visible] --> VOTE[User Clicks<br/>Vote Button]
  VOTE --> UPDATE["Update Firestore:<br/>sessions/sessionId/votes"]
  UPDATE --> RT["Real-time<br/>Listener"]
  RT --> REFRESH[Refresh Vote Count<br/>in UI]
  REFRESH --> DISPLAY[Show Updated<br/>Vote Results]
```
