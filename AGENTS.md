<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Domain math (dose calc, safety-interval per row, harvest conflicts) lives in src/lib/logic.ts so UI and future server code share one implementation.
- tsconfig strict extras (exactOptionalPropertyTypes etc.) are disabled to keep UI code simple.
- Business data persists in Lovable Cloud as generic tables (id text, data jsonb) loaded by src/lib/store.tsx, which diffs state by reference and upserts/deletes — keeps the UI store API unchanged.
- Sign-up is restricted by a DB trigger to invited emails (invitaciones table) plus the admin email; roles live in user_roles — no public signup.
