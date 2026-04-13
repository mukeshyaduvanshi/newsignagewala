import mongoose, { Schema, Document } from "mongoose";

export interface IRolePermission extends Document {
  teamMemberId: mongoose.Types.ObjectId;
  teamMemberName: string;
  teamMemberUniqueKey: string;
  permissions: {
    module: string; // Rates, Stores, Campaigns, Orders, Team Member, Created Store
    add: boolean;
    edit: boolean;
    view: boolean;
    delete: boolean;
    request: boolean;
  }[];
  createdId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  isActive: boolean;
  isUsedInWork: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema: Schema = new Schema(
  {
    teamMemberId: {
      type: Schema.Types.ObjectId,
      ref: "UserRole",
      required: true,
    },
    teamMemberName: {
      type: String,
      required: true,
    },
    teamMemberUniqueKey: {
      type: String,
      required: true,
    },
    permissions: [
      {
        module: {
          type: String,
          required: true,
        },
        add: {
          type: Boolean,
          default: false,
        },
        edit: {
          type: Boolean,
          default: false,
        },
        view: {
          type: Boolean,
          default: false,
        },
        delete: {
          type: Boolean,
          default: false,
        },
        bulk: {
          type: Boolean,
          default: false,
        },
        request: {
          type: Boolean,
          default: false,
        },
      },
    ],
    createdId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isUsedInWork: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
RolePermissionSchema.index({ createdId: 1, parentId: 1 });
RolePermissionSchema.index({ teamMemberId: 1, createdId: 1 });

const RolePermission =
  mongoose.models.RolePermission ||
  mongoose.model<IRolePermission>("RolePermission", RolePermissionSchema);

export default RolePermission;
