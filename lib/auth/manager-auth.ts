import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

export interface ManagerAuthData {
    userId: string;
    parentId: string;
    uniqueKey: string;
    teamMemberId?: string;
    email: string;
    userType: string;
}

/**
 * Extract and verify manager authentication from JWT token
 * Use this in manager API routes to get parentId and other manager data
 * 
 * @param req - NextRequest object
 * @returns Manager auth data or null if invalid
 */
export async function getManagerAuth(req: NextRequest): Promise<ManagerAuthData | null> {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = verifyAccessToken(token);

        if (!decoded || decoded.userType !== "manager") {
            return null;
        }

        // Check if parentId and uniqueKey exist in token
        // These are added during brand selection in login flow
        if (!decoded.parentId || !decoded.uniqueKey) {
            return null;
        }

        return {
            userId: decoded.userId,
            parentId: decoded.parentId,
            uniqueKey: decoded.uniqueKey,
            teamMemberId: decoded.teamMemberId,
            email: decoded.email,
            userType: decoded.userType,
        };
    } catch (error) {
        console.error("Manager auth error:", error);
        return null;
    }
}

/**
 * Verify if user is a manager and return manager data
 * Throws error with appropriate response if validation fails
 * 
 * @param req - NextRequest object
 * @returns Manager auth data
 * @throws Error with status and message if validation fails
 */
export async function requireManagerAuth(req: NextRequest): Promise<ManagerAuthData> {
    const managerAuth = await getManagerAuth(req);

    if (!managerAuth) {
        throw {
            status: 401,
            message: "Unauthorized - Invalid manager token or missing brand selection",
        };
    }

    return managerAuth;
}
