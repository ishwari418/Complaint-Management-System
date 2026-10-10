# Complaint Management System (browser-only demo)

*A Smarter Way to Raise, Track, and Resolve Complaints.*

Pure HTML, CSS and vanilla JavaScript. No PHP, SQL, Node.js, XAMPP or server. Data lives in your browser's localStorage.

## 1. Extract the ZIP
Right-click `complaint-management-demo.zip` and choose Extract All (Windows) or double-click it (macOS).

## 2. Open the app
Double-click `index.html`. It works from `file://` in modern Chrome, Edge, Firefox and Safari. Keep all pages in the same folder.

## 3. Demo accounts
| Role | Email | Password |
|---|---|---|
| Administrator | admin@cms.demo | Admin@123 |
| Maintenance Dept | maintenance@cms.demo | Dept@123 |
| IT Dept | it@cms.demo | Dept@123 |
| Water and Sanitation Dept | water@cms.demo | Dept@123 |
| User | student@cms.demo | User@123 |

Two more sample users (aarav@cms.demo, diya@cms.demo, password `User@123`) own some of the sample complaints. The login page has a "Demo accounts" helper that fills the form for you.

## 4. Register a new user
Register page: name, email, phone, password, confirm. Public accounts always get the `user` role. Duplicate emails are rejected.

## 5. Submit a complaint
Log in as a user, open **New Complaint**, fill the form and submit. You get a reference such as `CMP-2026-00013`.

## 6. Assign as administrator
Log in as admin, open **Complaints**, click **Assign** (or **Reassign**), choose a department, add remarks. Status becomes `Assigned` and the owner is notified. Admins can also reject a Submitted/Assigned complaint with a reason.

## 7. Update and resolve as department staff
Log in as a department account. You only see your department's complaints. Use **Start work**, **Add remark** and **Resolve** (resolution notes are mandatory). Users can **Reopen** a resolved complaint with a reason.

Status flow: Submitted -> Assigned -> In Progress -> Resolved (also Rejected and Reopened). Invalid transitions are blocked in JavaScript.

## 8. How localStorage works
The browser stores key/value text for each site. This app uses versioned keys: `cms_v1_users`, `_departments`, `_complaints`, `_history`, `_assignments`, `_notifications`, `_settings`. The login session uses `sessionStorage`, so closing the tab logs you out. Data survives refresh and restart. Sample data is created only once. If core data is missing or corrupted, it is re-seeded. Open tabs sync via the `storage` event.

## 9. Reset demo data
Admin dashboard -> **Settings** -> **Reset Demo Data** (asks for confirmation). This wipes this browser's data and restores the samples. It is not a security boundary.

## 10. Known limitations
- Data is per browser and per computer. Clearing site data, private windows or another browser means different (or no) data. There is no sync or backup.
- Attachments: only the file name is recorded. Files are not stored.
- Some browsers treat each `file://` folder as a separate storage area, so don't move pages between folders after use. If a browser blocks storage on `file://`, serve the folder locally with `python -m http.server` (optional, no backend) or use static hosting.
- Sessions are per tab.

## 11. Not production-secure
Passwords are stored in plain text in localStorage, and role checks are UI-level only. Anyone with the browser can read or edit the data via developer tools. Never enter real passwords or personal data.

## 12. Publish as a static demo
Upload the folder to GitHub Pages, Netlify Drop or Cloudflare Pages. Each visitor gets their own private browser data.
