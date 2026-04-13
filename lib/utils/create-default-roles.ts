import UserRole from "@/lib/models/UserRole";
import RolePermission from "@/lib/models/RolePermission";
import mongoose from "mongoose";

/**
 * Function to convert label name to camelCase
 */
function generateUniqueKey(labelName: string): string {
  return labelName
    .trim()
    .split(/\s+/) // Split by one or more spaces
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Create default manager roles and permissions for a brand user
 * This function creates 3 default manager roles:
 * 1. Operation Managers - with all permissions on all modules
 * 2. Financial Managers - with all permissions on all modules
 * 3. Creative Managers - with only edit and view permissions on Orders module
 * 
 * @param brandUserId - MongoDB ObjectId of the brand user
 * @returns Promise<void>
 */
export async function createDefaultManagerRoles(brandUserId: mongoose.Types.ObjectId) {
  try {
    console.log(`[CREATE_ROLES] 🔄 Starting to create default manager roles for brand ${brandUserId}...`);
    
    // Verify userId is valid
    if (!brandUserId) {
      throw new Error('Brand user ID is required');
    }
    // console.log(`[CREATE_ROLES] ✅ Brand user ID validated: ${brandUserId}`);
    
    // Define default manager labels with their specific permissions
    const managerRoles = [
      {
        labelName: "Operation Managers",
        description: "Manages day-to-day operations, stores, and campaigns",
        permissions: [
          { module: "Team Member", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Stores", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Created-Sites", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Rates", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Racee", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Campaigns", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Orders", add: true, edit: true, view: true, delete: true, request: true },
        ]
      },
      {
        labelName: "Financial Managers", 
        description: "Manages financial operations, rates, and orders",
        permissions: [
          { module: "Team Member", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Stores", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Created-Sites", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Rates", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Racee", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Campaigns", add: true, edit: true, view: true, delete: true, request: true },
          { module: "Orders", add: true, edit: true, view: true, delete: true, request: true },
        ]
      },
      {
        labelName: "Creative Managers", 
        description: "Manages creative operations, campaigns, and content",
        permissions: [
          { module: "Team Member", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Stores", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Created-Sites", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Rates", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Racee", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Campaigns", add: false, edit: false, view: false, delete: false, request: false },
          { module: "Orders", add: false, edit: true, view: true, delete: false, request: false },
        ]
      }
    ];

    // console.log(`[CREATE_ROLES] 📋 Will create ${managerRoles.length} manager roles`);

    // Create UserRole and RolePermission for each manager label
    for (const role of managerRoles) {
      const uniqueKey = generateUniqueKey(role.labelName);

    //   console.log(`[CREATE_ROLES]   📝 Creating ${role.labelName} (${uniqueKey})...`);

      try {
        // Create UserRole
        const userRole = await UserRole.create({
          labelName: role.labelName,
          uniqueKey: uniqueKey,
          description: role.description,
          createdId: brandUserId,
          parentId: brandUserId,
          isActive: true,
          isUsedInTeam: false,
        });

        // console.log(`[CREATE_ROLES]   ✅ UserRole created with ID: ${userRole._id}`);

        // Create RolePermission with specific permissions for this role
        const rolePermission = await RolePermission.create({
          teamMemberId: userRole._id,
          teamMemberName: role.labelName,
          teamMemberUniqueKey: uniqueKey,
          permissions: role.permissions,
          createdId: brandUserId,
          parentId: brandUserId,
          isActive: true,
          isUsedInWork: false,
        });

        // console.log(`[CREATE_ROLES]   ✅ RolePermission created with ID: ${rolePermission._id}`);
      } catch (roleError) {
        console.error(`[CREATE_ROLES]   ❌ Error creating ${role.labelName}:`, roleError);
        throw roleError; // Re-throw to handle in outer catch
      }
    }

    // console.log(`[CREATE_ROLES] 🎉 Successfully created ${managerRoles.length} default manager roles for brand ${brandUserId}`);
  } catch (error) {
    console.error("[CREATE_ROLES] ❌ Error creating default manager roles:", error);
    console.error("[CREATE_ROLES] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      brandUserId
    });
    throw error;
  }
}
