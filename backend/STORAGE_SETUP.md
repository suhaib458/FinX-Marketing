# FinX storage setup

FinX uses two storage modes:

- Development: local disk storage under `backend/.data/uploads`.
- Production: Firebase Storage.

The default `STORAGE_MODE=auto` selects local storage outside production so local development does not depend on an initialized Firebase Storage bucket.

## Development

No Firebase Storage setup is required. Product images and logos are written to:

```text
backend/.data/uploads
```

and served by the backend at:

```text
/api/v1/uploads/...
```

The directory is ignored by Git.

Verify it with:

```powershell
npm run storage:check
```

Expected result:

```json
{
  "status": "ready",
  "mode": "local",
  "bucket": "local-development",
  "write": "ok",
  "delete": "ok"
}
```

## Production

Set:

```env
STORAGE_MODE=firebase
FIREBASE_STORAGE_BUCKET=<real Firebase Storage bucket>
```

The bucket must already exist and the Firebase Admin service account must have permission to read and write objects.
