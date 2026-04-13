import React, { useState } from 'react'
import { useBrandViewDetailsManagerStore } from '@/lib/hooks/useBrandViewDetailsManagerStore';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store } from 'lucide-react';
import StoreListComponent from './store-list-component';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  uniqueKey: string;
  managerType: string;
  canChangeType: boolean;
  companyLogo?: string;
}

interface ComponentsViewDetailsStoreProps {
  member: Member;
}

const ComponentsViewDetailsStore: React.FC<ComponentsViewDetailsStoreProps> = ({ member }) => {
    const { managerDetails, isLoading, isError } = useBrandViewDetailsManagerStore(member.id);
    const [storeModalOpen, setStoreModalOpen] = useState(false);
    
    if (isLoading) {
      return <div className="flex items-center justify-center p-8">Loading...</div>;
    }
    if (isError) {
      return <div className="flex items-center justify-center p-8 text-red-500">Error loading manager details.</div>;
    }

  return (
    <>
      <div className="space-y-6">
        {/* Member Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <div className="flex items-center gap-3 mt-1">
              {/* Company Logo Circle */}
              {managerDetails?.companyLogo ? (
                <img
                  src={managerDetails.companyLogo || '/avatars/user.png'}
                  alt="Company Logo"
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-semibold text-white border-2 border-primary ${
                  managerDetails?.companyLogo ? 'hidden' : ''
                }`}
              >
                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
              </div>
              <p className="font-medium">{member.name}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{member.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{member.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Manager Type</p>
            <p className="font-medium">{member.managerType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium capitalize">
              {member.status === 'success' ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Store Information Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Store Information</h3>
            <Button
              variant="outline"
              onClick={() => setStoreModalOpen(true)}
              className="relative"
            >
              <Store className="mr-2 h-4 w-4" />
              Stores
              {managerDetails?.storeCount && managerDetails.storeCount > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {managerDetails.storeCount}
                </Badge>
              )}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            This manager is assigned to <span className="font-semibold">{managerDetails?.storeCount || 0}</span> store(s)
          </div>
        </div>
      </div>

      {/* Store List Modal */}
      <Dialog open={storeModalOpen} onOpenChange={setStoreModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assigned Stores</DialogTitle>
            <DialogDescription>
              List of stores assigned to {member.name}
            </DialogDescription>
          </DialogHeader>
          <StoreListComponent stores={managerDetails?.stores || []} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ComponentsViewDetailsStore