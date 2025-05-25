import { z } from "zod";
// TODO: Add these imports as you implement the functions in wordpress/api.js
import { createUser, updateUser, disableUser, resetUserPassword, setUserRole, listUserRoles } from "../wordpress/api.js";
/**
 * Register all user and role management tools with the MCP server
 */
export function registerUserTools(server) {
    // List Users Tool
    server.tool("list-users", "List WordPress users with filtering options", {
        page: z.number().default(1).describe("Page number (default: 1)"),
        perPage: z.number().max(100).default(10).describe("Users per page (max: 100)"),
        role: z.string().optional().describe("Filter by user role (e.g., 'administrator', 'editor', 'author')"),
        search: z.string().optional().describe("Search users by name or email"),
        orderBy: z.enum(["id", "include", "name", "registered_date", "slug", "include_slugs", "email", "url"]).default("registered_date").describe("Order users by"),
        order: z.enum(["asc", "desc"]).default("desc").describe("Sort order"),
        registeredAfter: z.string().optional().describe("Filter users registered after this date (ISO format)"),
        registeredBefore: z.string().optional().describe("Filter users registered before this date (ISO format)")
    }, async ({ page, perPage, role, search, orderBy, order, registeredAfter, registeredBefore }) => {
        try {
            // TODO: Implement listUsers in wordpress/api.js
            // const result = await listUsers({ page, perPage, role, search, orderBy, order, registeredAfter, registeredBefore });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ list-users tool not yet implemented. Please add listUsers function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error listing users:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error listing users: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Create User Tool
    server.tool("create-user", "Create a new WordPress user account", {
        username: z.string().min(1).describe("Username for the new user"),
        email: z.string().email().describe("Email address for the new user"),
        password: z.string().min(6).describe("Password for the new user (min 6 characters)"),
        firstName: z.string().optional().describe("User's first name"),
        lastName: z.string().optional().describe("User's last name"),
        displayName: z.string().optional().describe("Display name (defaults to username)"),
        role: z.string().default("subscriber").describe("User role (default: subscriber)"),
        bio: z.string().optional().describe("User biography/description"),
        website: z.string().url().optional().describe("User's website URL"),
        sendNotification: z.boolean().default(true).describe("Send welcome email to new user")
    }, async ({ username, email, password, firstName, lastName, displayName, role, bio, website, sendNotification }) => {
        try {
            // TODO: Implement createUser in wordpress/api.js
            const result = await createUser({
                username,
                email,
                password,
                firstName,
                lastName,
                displayName: displayName || username,
                role,
                bio,
                website,
                sendNotification
            });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ create-user tool not yet implemented. Please add createUser function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error creating user:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error creating user: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Update User Tool
    server.tool("update-user", "Update an existing WordPress user's profile details", {
        userId: z.number().describe("ID of the user to update"),
        email: z.string().email().optional().describe("New email address"),
        firstName: z.string().optional().describe("New first name"),
        lastName: z.string().optional().describe("New last name"),
        displayName: z.string().optional().describe("New display name"),
        bio: z.string().optional().describe("New biography/description"),
        website: z.string().url().optional().describe("New website URL"),
        password: z.string().min(6).optional().describe("New password (min 6 characters)")
    }, async ({ userId, email, firstName, lastName, displayName, bio, website, password }) => {
        try {
            // TODO: Implement updateUser in wordpress/api.js
            const result = await updateUser(userId, {
                email,
                firstName,
                lastName,
                displayName,
                bio,
                website,
                password
            });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ update-user tool not yet implemented. Please add updateUser function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error updating user:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error updating user: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Disable User Tool
    server.tool("disable-user", "Temporarily deactivate a WordPress user account", {
        userId: z.number().describe("ID of the user to disable"),
        reason: z.string().optional().describe("Reason for disabling the account")
    }, async ({ userId, reason }) => {
        try {
            // TODO: Implement disableUser in wordpress/api.js
            const result = await disableUser(userId, reason);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ disable-user tool not yet implemented. Please add disableUser function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error disabling user:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error disabling user: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Reset User Password Tool
    server.tool("reset-user-password", "Generate a password reset link for a WordPress user", {
        userId: z.number().optional().describe("ID of the user (optional if email provided)"),
        email: z.string().email().optional().describe("Email of the user (optional if userId provided)"),
        sendEmail: z.boolean().default(true).describe("Send reset link via email")
    }, async ({ userId, email, sendEmail }) => {
        try {
            if (!userId && !email) {
                return {
                    content: [{
                            type: "text",
                            text: "Either userId or email must be provided"
                        }],
                    isError: true
                };
            }
            // TODO: Implement resetUserPassword in wordpress/api.js
            const result = await resetUserPassword({ userId, email, sendEmail });
            return {
                content: [{
                        type: "text",
                        text: "⚠️ reset-user-password tool not yet implemented. Please add resetUserPassword function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error resetting user password:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error resetting user password: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // Set User Role Tool
    server.tool("set-user-role", "Change a WordPress user's role and permissions", {
        userId: z.number().describe("ID of the user"),
        role: z.string().describe("New role to assign (e.g., 'administrator', 'editor', 'author', 'contributor', 'subscriber')"),
        removeOtherRoles: z.boolean().default(true).describe("Remove other roles when setting new role")
    }, async ({ userId, role, removeOtherRoles }) => {
        try {
            // Validate common WordPress roles
            const validRoles = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
            if (!validRoles.includes(role.toLowerCase())) {
                console.warn(`Warning: '${role}' is not a standard WordPress role. Proceeding anyway...`);
            }
            // TODO: Implement setUserRole in wordpress/api.js
            const result = await setUserRole(userId, role, removeOtherRoles);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ set-user-role tool not yet implemented. Please add setUserRole function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error setting user role:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error setting user role: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
    // List User Roles Tool
    server.tool("list-user-roles", "View available WordPress user roles and their capabilities", {
        includeCapabilities: z.boolean().default(false).describe("Include detailed capability information for each role")
    }, async ({ includeCapabilities }) => {
        try {
            // TODO: Implement listUserRoles in wordpress/api.js
            const result = await listUserRoles(includeCapabilities);
            return {
                content: [{
                        type: "text",
                        text: "⚠️ list-user-roles tool not yet implemented. Please add listUserRoles function to wordpress/api.js"
                    }],
                isError: true
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error("Error listing user roles:", error);
            return {
                content: [{
                        type: "text",
                        text: `Error listing user roles: ${errorMessage}`
                    }],
                isError: true
            };
        }
    });
}
