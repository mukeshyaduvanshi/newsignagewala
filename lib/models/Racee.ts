import mongoose, { Schema, Document } from 'mongoose';

export interface IRacee extends Document {
  storeId: mongoose.Types.ObjectId;
  storeName: string;
  managerUserId: mongoose.Types.ObjectId;
  managerName: string;
  teamId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  newStorePhoto?: string;
  storeLocation?: {
    type: string;
    coordinates: number[];
  };
  sites?: Array<{
    _id?: mongoose.Types.ObjectId;
    rateId: string;
    elementName: string;
    uniqueKey: string;
    description?: string;
    rateType: 'fixed' | 'custom';
    measurementUnit: string;
    calculateUnit: string;
    width: number;
    height: number;
    rate: number;
    photo: string;
    location?: {
      type: string;
      coordinates: number[];
    };
    createdAt: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const RaceeSchema: Schema<IRacee> = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required'],
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
    },
    managerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Manager user ID is required'],
    },
    managerName: {
      type: String,
      required: [true, 'Manager name is required'],
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamMember',
      required: [true, 'Team ID is required'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent ID (brand) is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    newStorePhoto: {
      type: String,
    },
    storeLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [],
      },
    },
    sites: {
      type: [
        {
          rateId: { type: String, required: true },
          elementName: { type: String, required: true },
          uniqueKey: { type: String },
          description: { type: String },
          rateType: { type: String, enum: ['fixed', 'custom'], required: true },
          measurementUnit: { type: String, required: true },
          calculateUnit: { type: String, required: true },
          width: { type: Number },
          height: { type: Number },
          rate: { type: Number, required: true },
          photo: { type: String, required: true },
          siteDescription: { type: String },
          // location: {
          //   type: {
          //     type: String,
          //     default: 'Point',
          //   },
          //   coordinates: {
          //     type: [Number],
          //   },
          // },
          createdAt: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for quick lookups
RaceeSchema.index({ parentId: 1, status: 1 });
RaceeSchema.index({ managerUserId: 1, status: 1 });
RaceeSchema.index({ storeId: 1 });

const Racee = mongoose.models.Racee || mongoose.model<IRacee>('Racee', RaceeSchema);

export default Racee;
