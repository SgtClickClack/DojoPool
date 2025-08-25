# Admin Backend Implementation Notes

This service now supports an Admin Panel backend with protected endpoints.

## What was added

- Prisma: Role enum (USER, ADMIN), `User.role: Role @default(USER)`, `User.isBanned: Boolean @default(false)`.
- Auth: `AdminGuard` which only passes if `request.user.role === 'ADMIN'`.
- Admin module with protected endpoints under `/api/v1/admin`:
  - `GET /api/v1/admin/stats` — total users, matches, clans.
  - `GET /api/v1/admin/users?page=1&pageSize=20` — paginated list of users.
  - `PATCH /api/v1/admin/users/:id/ban` — toggles a user's `isBanned` flag.
  - `DELETE /api/v1/admin/users/:id` — deletes a user.

All routes require JWT auth + Admin role.

## How `request.user` is populated

- JwtStrategy attaches `{ userId, username, role }` from the JWT payload to `request.user`.
- AuthService signs tokens with `{ sub: user.id, username: user.username, role: user.role }`.

## Local setup / migration guide (SQLite)

1. Ensure env has `JWT_SECRET` set for API server.
2. Regenerate Prisma client after schema changes:
   - From `services/api` directory:
     - `npx prisma generate`
3. Apply schema changes to SQLite DB (dev):
   - Option A: Reset dev db (destructive): `npx prisma migrate reset`
   - Option B: Create migration and apply: `npx prisma migrate dev --name add-role-and-isbanned`
4. Promote your user to ADMIN for testing:
   - Open Prisma Studio: `npx prisma studio`
   - Navigate to `User` table and set `role` to `ADMIN` for your account.
   - Alternatively, use the SQLite client to run: `UPDATE User SET role='ADMIN' WHERE email='you@example.com';`

## Testing the endpoints

- Obtain a JWT by logging in via existing auth endpoint.
- Include `Authorization: Bearer <token>` header.
- Verify:
  - `GET http://localhost:8080/api/v1/admin/stats`
  - `GET http://localhost:8080/api/v1/admin/users?page=1&pageSize=10`
  - `PATCH http://localhost:8080/api/v1/admin/users/<USER_ID>/ban`
  - `DELETE http://localhost:8080/api/v1/admin/users/<USER_ID>`

## Notes

- `isBanned` does not currently prevent login or actions; enforcement can be added to auth flows if desired.
- Deleting users may have cascading effects; several relations use `onDelete: Cascade`, but review before using in production.
