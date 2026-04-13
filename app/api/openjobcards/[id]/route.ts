import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import mongoose from 'mongoose';

const openJobCardsSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  orderDate: { type: Date, required: true },
  deadlineDate: { type: Date, required: true },
  globalcreativeLink: { type: String },
  notes: { type: String },
  orderStatus: { type: String, required: true },
  sites: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
});

const OpenJobCards = mongoose.models.OpenJobCards || mongoose.model('OpenJobCards', openJobCardsSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Job card ID is required' },
        { status: 400 }
      );
    }

    const jobCard = await OpenJobCards.findById(id);

    if (!jobCard) {
      return NextResponse.json(
        { success: false, message: 'Job card not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: jobCard 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching job card:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch job card' },
      { status: 500 }
    );
  }
}
