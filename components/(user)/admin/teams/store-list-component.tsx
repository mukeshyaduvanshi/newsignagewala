import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Mail } from 'lucide-react';

interface StoreLocation {
  type: string;
  coordinates: number[];
}

interface Store {
  _id: string;
  storeName: string;
  storeCode?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  storePhone?: string;
  storeEmail?: string;
  storeLocation?: StoreLocation;
  status?: string;
}

interface StoreListComponentProps {
  stores: Store[];
}

const StoreListComponent: React.FC<StoreListComponentProps> = ({ stores }) => {
  if (!stores || stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No stores assigned</p>
        <p className="text-sm text-muted-foreground mt-2">This manager has no stores assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store._id}>
                <TableCell>
                  <div className="font-medium">{store.storeName}</div>
                  {store.address && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {store.address}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {store.storeCode && (
                    <Badge variant="outline">{store.storeCode}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {store.city && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{store.city}</span>
                        {store.state && <span>, {store.state}</span>}
                      </div>
                    )}
                    {store.pincode && (
                      <div className="text-xs text-muted-foreground">
                        PIN: {store.pincode}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {store.storePhone && (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{store.storePhone}</span>
                      </div>
                    )}
                    {store.storeEmail && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{store.storeEmail}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={store.status === 'active' ? 'default' : 'secondary'}
                  >
                    {store.status || 'N/A'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
        <span>Total Stores: {stores.length}</span>
      </div>
    </div>
  );
};

export default StoreListComponent;
