import mongoose from "mongoose";

// Installer info sub-schema
const installerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  capturedAt: { type: Date, default: Date.now },
}, { _id: false });

// Site schema for InstallationCertificates
const siteSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId },
  elementName: { type: String },
  siteDescription: { type: String },
  storeName: { type: String },
  storeId: { type: mongoose.Schema.Types.ObjectId },
  photo: { type: String },
  width: { type: Number },
  height: { type: Number },
  measurementUnit: { type: String },
  rate: { type: Number },
  calculateUnit: { type: String },
  quantity: { type: Number },
  creativeLink: { type: String },
  instructions: { type: String },
  storeLocation: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  // Installation status
  status: { type: String, enum: ['pending', 'installed', 'submitted', 'vendorVerified'], default: 'pending' },
  // New fields for image capture
  capturedImages: { type: [String], default: [] },
  installers: { type: [installerSchema], default: [] },
}, { _id: false });

// InstallationCertificate schema
const installationCertificateSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  orderNumber: { type: String, required: true },
  orderDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  globalCreativeLink: { type: String },
  notes: { type: String },
  orderStatus: { type: String, required: true },
  sites: [siteSchema],
  createdAt: { type: Date, default: Date.now },
}, { 
  strict: false, // Allow fields not in schema
  timestamps: false 
});

// Delete existing model if it exists to force re-registration
if (mongoose.models.InstallationCertificate) {
  delete mongoose.models.InstallationCertificate;
}

const InstallationCertificate = mongoose.model("InstallationCertificate", installationCertificateSchema);

export default InstallationCertificate;
