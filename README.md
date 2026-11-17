# HomoeoClinic
Stock, patients, prescriptions, sales and backups for a homoeopathic clinic + medical store.
Works fully offline. **Developed by Zaeem Azhar.**

## Install on an Android phone
1. Put this folder in a GitHub repository (all files, including the hidden `.github` folder).
2. On GitHub: **Releases → Draft a new release → create tag `v1.0.0` → Publish**
   (or **Actions → Build Android APK → Run workflow**, then download the artifact).
3. After ~5–8 minutes the release contains **HomoeoClinic.apk**. Open it on the phone, allow
   "install unknown apps", install.

## IMPORTANT – so updates never wipe your data
Android only updates an app if it is signed with the **same key** each time. Create one key, once:

```
keytool -genkeypair -v -keystore homoeoclinic.keystore -alias homoeoclinic -keyalg RSA -keysize 2048 -validity 12000
base64 -w0 homoeoclinic.keystore      # copy this output
```
GitHub repo → Settings → Secrets and variables → Actions → add:
`KEYSTORE_BASE64` (the output above), `KEYSTORE_PASSWORD`, `KEY_ALIAS` (= homoeoclinic).
Keep the `.keystore` file safe forever (never upload it to the repo).
Without these secrets the build is a debug APK; to install a newer one you would have to
uninstall first, which **deletes app data – make a backup first**.

## Features
Medicine cards with potency pills and quick filters (Dilutions / Q / Biochemic-BC / Patents) · open-bottle tracking ·
bonus "10 + 1 free" on deliveries · expired write-off · near-expiry return list per supplier (WhatsApp/PDF) ·
patient cases with courses, previous-visit panel, repeat last Rx, medium + directions presets, Parhez list, Rx letterhead PDF,
WhatsApp Rx and follow-up reminders · treatment packages (Sell and Today's sales) · cash box with expenses ·
camera barcode scan (where the phone supports it; otherwise type the code) · detailed backups.

## Your data and backups
- Data lives inside the app (IndexedDB) and survives closing/restarting the app.
- Settings → Backup: manual backup file, optional password encryption, 8 automatic internal
  snapshots, and a rolling daily file in Documents/HomoeoClinic/Auto-backup.
- Regularly **Share** a backup to WhatsApp/Drive/email/your PC. A backup that exists only on the
  same phone is lost if the phone is lost.

## Develop
`node build.js` → `www/index.html` (single offline file; also opens in any browser).
