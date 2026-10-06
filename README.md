# Member ID card — QR + MySQL

Register a member → saved in MySQL → ID card with a QR code → scanning the QR reads the record back from MySQL.

## Flow
| Route | What it does |
| --- | --- |
| `/` | Registration form: photo, name, location, date of birth, phone, state, constituency, joined, **Aadhaar card** and **Voter ID** attachments (JPG/PNG/PDF). Saves to MySQL, generates ID like `STPK-26-353677`. |
| `/card/$id` | The printable card (front/back) loaded from MySQL. The QR encodes `<BASE_URL>/verify/<id>`. |
| `/verify/$id` | What a phone opens after scanning. Public view: photo, name, location, state, constituency, joined, ID. **DOB, phone, Aadhaar and Voter ID are hidden** until staff enter `ADMIN_PASSWORD`. |
| `/scan` | In-app camera scanner (jsQR). Reads the QR, then opens `/verify/$id`. Manual ID entry as fallback. |

Backend code: `src/lib/members.functions.ts` (server functions `createMember`, `getMember`) and `src/lib/db.server.ts` (MySQL pool + auto table creation). Table definition is also in `schema.sql`.

## Run it
```sh
cp .env.example .env     # fill in DB_*, VITE_PUBLIC_BASE_URL and ADMIN_PASSWORD
npm install
npm run dev              # development
# or production:
npm run build && npm start   # node server on port 3000 (set PORT to change)
```
The table is created automatically on first request (or run `schema.sql` yourself).

**QR base URL:** set `VITE_PUBLIC_BASE_URL` to the address phones can reach (your domain, or your PC's LAN IP in testing). If it says `localhost`, a phone that scans the card won't be able to open it. Rebuild after changing it.

**Camera scanning** needs HTTPS (or localhost). Phones' built-in camera apps work on any URL.

**Hosting note:** `vite.config.ts` builds a Node server (`nitro: { preset: "node-server" }`) because MySQL needs TCP sockets, which Cloudflare Workers (the Lovable default) don't allow.

## Privacy
Aadhaar/Voter ID files are stored in the `member_documents` table and are only returned by the server after the staff password is verified. Run the app over HTTPS, use a long `ADMIN_PASSWORD`, restrict database access, and back up securely. Check the legal rules for storing Aadhaar copies and get member consent.
