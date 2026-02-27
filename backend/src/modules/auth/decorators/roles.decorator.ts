import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used by RolesGuard to read required roles from route handlers.
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator
 *
 * Attaches role metadata to a controller class or route handler.
 * RolesGuard reads this metadata and enforces access control.
 *
 * Supported roles:
 *   - 'admin'              – Full system access
 *   - 'advisor'            – Client-facing operations
 *   - 'compliance_officer' – Audit and compliance views
 *   - 'analyst'            – Read/write analytics data
 *   - 'read_only'          – Read-only access across the application
 *
 * Usage:
 * ```ts
 * @UseGuards(SupabaseAuthGuard, RolesGuard)
 * @Roles('admin', 'compliance_officer')
 * @Delete('clients/:id')
 * deleteClient(@Param('id') id: string) { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
