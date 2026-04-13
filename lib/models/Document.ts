import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IDocument extends Document {
  documentType: 'gst' | 'cin' | 'msme';
  documentNumber: string;
  verified: boolean;
  verifiedAt: Date;
  verifiedBy: mongoose.Types.ObjectId;
  verificationData: any;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentType: {
      type: String,
      enum: ['gst', 'cin', 'msme'],
      required: true,
    },
    documentNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verificationData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
DocumentSchema.index({ documentType: 1, documentNumber: 1 });

const DocumentModel = models.Document || model<IDocument>('Document', DocumentSchema);

export default DocumentModel;
