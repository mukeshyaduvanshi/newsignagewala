"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

interface BulkAddStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface StoreRecord {
  id: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storePincode: string;
  storeCountry: string;
  storeState: string;
  storeCity: string;
  index: number;
  errors: string[];
  isValid: boolean;
  isDuplicate?: boolean;
  existsInDB?: boolean;
}

export function BulkAddStoreModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkAddStoreModalProps) {
  const { accessToken } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<StoreRecord[]>([]);
  const [validatedData, setValidatedData] = useState<StoreRecord[]>([]);
  const [showValidationTable, setShowValidationTable] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    [key: number]: string[];
  }>({});
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isFetchingPincodes, setIsFetchingPincodes] = useState(false);
  const [revalidatingRowIndex, setRevalidatingRowIndex] = useState<number | null>(null);

  // Parse CSV content with proper handling of quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator (only if not in quotes)
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
    // Add last field
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ""));
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 3) {
        const row: any = {};
        headers.forEach((header, index) => {
          if (values[index]) {
            // Remove surrounding quotes if present
            row[header] = values[index].replace(/^["']|["']$/g, "");
          }
        });

        // Map to expected fields
        const mappedRow = {
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          storeName: row.storename || row["store name"] || values[0]?.replace(/^["']|["']$/g, "") || "",
          storeAddress: row.storeaddress || row["store address"] || values[1]?.replace(/^["']|["']$/g, "") || "",
          storePhone: row.storephone || row["store phone"] || values[2]?.replace(/^["']|["']$/g, "") || "",
          storePincode: row.storepincode || row["store pincode"] || row.pincode || values[3]?.replace(/^["']|["']$/g, "") || "",
          storeCountry: row.storecountry || row["store country"] || values[4]?.replace(/^["']|["']$/g, "") || "",
          storeState: row.storestate || row["store state"] || values[5]?.replace(/^["']|["']$/g, "") || "",
          storeCity: row.storecity || row["store city"] || values[6]?.replace(/^["']|["']$/g, "") || "",
        };

        data.push(mappedRow);
      }
    }
    return data;
  };

  // Validate individual record
  const validateRecord = (record: any, index: number): StoreRecord => {
    const errors: string[] = [];
    const phoneRegex = /^\d{10}$/;
    const pincodeRegex = /^\d{6}$/;

    // Validate store name
    if (!record.storeName || record.storeName.trim().length < 2) {
      errors.push("Store name must be at least 2 characters");
    }

    // Validate address
    if (!record.storeAddress || record.storeAddress.trim().length < 5) {
      errors.push("Store address must be at least 5 characters");
    }

    // Validate phone
    const cleanPhone = record.storePhone?.replace(/\D/g, "");
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      errors.push("Phone must be 10 digits");
    }

    // Validate pincode
    if (!record.storePincode || !pincodeRegex.test(record.storePincode)) {
      errors.push("Pincode must be 6 digits");
    }

    // Validate city and state are filled (CSV se ya pincode se)
    if (!record.storeCity || record.storeCity.trim().length < 2) {
      errors.push("City required (use CSV or click revalidate)");
    }

    if (!record.storeState || record.storeState.trim().length < 2) {
      errors.push("State required (use CSV or click revalidate)");
    }

    return {
      ...record,
      storePhone: cleanPhone || record.storePhone,
      index,
      errors,
      isValid: errors.length === 0,
    };
  };

  // Check for duplicates within upload and in database
  const checkDuplicates = async (data: StoreRecord[]) => {
    // Check internal duplicates (name + address)
    const seen = new Map<string, number>();
    const duplicateIndexes = new Set<number>();

    data.forEach((record, index) => {
      const key = `${record.storeName.toLowerCase().trim()}-${record.storeAddress.toLowerCase().trim()}`;
      if (seen.has(key)) {
        duplicateIndexes.add(index);
        duplicateIndexes.add(seen.get(key)!);
      } else {
        seen.set(key, index);
      }
    });

    // Check database for existing stores
    try {
      const response = await fetch("/api/brand/stores/check-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          stores: data.map((r) => ({
            storeName: r.storeName,
            storeAddress: r.storeAddress,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const existingStores = new Set(result.data.existingStores || []);

        data.forEach((record, index) => {
          const key = `${record.storeName.toLowerCase().trim()}-${record.storeAddress.toLowerCase().trim()}`;
          if (existingStores.has(key)) {
            record.existsInDB = true;
            record.errors.push("Store already exists in database");
            record.isValid = false;
          }
          if (duplicateIndexes.has(index)) {
            record.isDuplicate = true;
            record.errors.push("Duplicate name + address in upload");
            record.isValid = false;
          }
        });
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
    }

    return data;
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setShowValidationTable(false);
    setParsedData([]);
    setValidatedData([]);
    setValidationErrors({});

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast.error("No valid data found in the CSV file");
        return;
      }

      if (parsed.length > 100) {
        toast.error("Maximum 100 stores allowed per upload");
        return;
      }

      setParsedData(parsed);

      // Validate each record
      let validated = parsed.map((record, index) =>
        validateRecord(record, index)
      );

      // Check for duplicates
      validated = await checkDuplicates(validated);

      // Create validation errors map
      const errors: { [key: number]: string[] } = {};
      validated.forEach((record) => {
        if (!record.isValid) {
          errors[record.index] = record.errors;
        }
      });

      setValidatedData(validated);
      setValidationErrors(errors);
      setShowValidationTable(true);

      const validCount = validated.filter((r) => r.isValid).length;
      const invalidCount = validated.length - validCount;

      if (invalidCount > 0) {
        toast.warning(
          `${invalidCount} stores have validation errors. Please fix them before uploading.`
        );
      } else {
        toast.success(
          `All ${validCount} stores are valid and ready for upload!`
        );
      }
    } catch (error) {
      console.error("Error parsing CSV file:", error);
      toast.error("Error reading CSV file");
    }
  };

  // Handle cell edit
  const handleCellEdit = useCallback(
    (rowIndex: number, field: string, value: string) => {
      const updatedData = [...validatedData];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        [field]: value,
      };
      setValidatedData(updatedData);
    },
    [validatedData]
  );

  // Handle pincode blur - just update the value, don't auto-fetch
  const handlePincodeBlur = async (rowIndex: number, pincode: string) => {
    // Just update the pincode value, no auto-fetch
    // User can click revalidate button to fetch location from pincode
  };

  // Bulk revalidate all rows
  const handleBulkRevalidate = async () => {
    setIsRevalidating(true);
    try {
      // Revalidate all records
      const revalidatedData = validatedData.map((record, index) => 
        validateRecord(record, index)
      );

      // Check duplicates for all
      const updated = await checkDuplicates(revalidatedData);

      // Update validation errors
      const errors: { [key: number]: string[] } = {};
      updated.forEach((record) => {
        if (!record.isValid) {
          errors[record.index] = record.errors;
        }
      });

      setValidatedData(updated);
      setValidationErrors(errors);

      const validCount = updated.filter((r) => r.isValid).length;
      const invalidCount = updated.length - validCount;

      if (invalidCount > 0) {
        toast.warning(`${invalidCount} stores have validation errors`);
      } else {
        toast.success(`All ${validCount} stores are valid!`);
      }
    } catch (error) {
      console.error("Error during bulk revalidation:", error);
      toast.error("Error during revalidation");
    } finally {
      setIsRevalidating(false);
    }
  };

  // Bulk fetch pincodes for all rows
  const handleBulkFetchPincodes = async () => {
    setIsFetchingPincodes(true);
    try {
      const updatedData = [...validatedData];
      let successCount = 0;
      let failCount = 0;

      // Process all rows with valid pincodes
      for (let i = 0; i < updatedData.length; i++) {
        const record = updatedData[i];
        
        if (record.storePincode && /^\d{6}$/.test(record.storePincode)) {
          try {
            const response = await fetch(
              `/api/brand/stores/pincode-lookup?pincode=${record.storePincode}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                updatedData[i].storeCity = result.data.city || record.storeCity;
                updatedData[i].storeState = result.data.state || record.storeState;
                updatedData[i].storeCountry = result.data.country || "India";
                successCount++;
              } else {
                failCount++;
              }
            } else {
              failCount++;
            }
          } catch (error) {
            console.error(`Error fetching pincode for row ${i + 1}:`, error);
            failCount++;
          }
        }
      }

      setValidatedData(updatedData);

      if (successCount > 0) {
        toast.success(`Fetched location for ${successCount} stores!`);
      }
      if (failCount > 0) {
        toast.warning(`Failed to fetch ${failCount} pincodes`);
      }
      if (successCount === 0 && failCount === 0) {
        toast.info("No valid pincodes to fetch");
      }
    } catch (error) {
      console.error("Error during bulk pincode fetch:", error);
      toast.error("Error fetching pincodes");
    } finally {
      setIsFetchingPincodes(false);
    }
  };

  // Revalidate row - Fetch city/state from pincode
  const handleRevalidateRow = async (rowIndex: number) => {
    setRevalidatingRowIndex(rowIndex);
    try {
      const record = validatedData[rowIndex];
    
    // If pincode is valid (6 digits), fetch location from pincode
    if (record.storePincode && /^\d{6}$/.test(record.storePincode)) {
      try {
        const response = await fetch(
          `/api/brand/stores/pincode-lookup?pincode=${record.storePincode}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Update city and state from pincode API
            record.storeCity = result.data.city || record.storeCity;
            record.storeState = result.data.state || record.storeState;
            record.storeCountry = result.data.country || "India";
            toast.success("Location updated from pincode!");
          } else {
            toast.error("Invalid pincode - location not found");
          }
        } else {
          toast.error("Invalid pincode - location not found");
        }
      } catch (error) {
        console.error("Error fetching pincode data during revalidation:", error);
        toast.error("Error fetching location from pincode");
      }
    }

    // Now validate the record with updated data
    const revalidated = validateRecord(record, rowIndex);

    // Check duplicates again
    const updated = await checkDuplicates([revalidated]);

    const updatedData = [...validatedData];
    updatedData[rowIndex] = updated[0];
    setValidatedData(updatedData);

    const newErrors = { ...validationErrors };
    if (updated[0].isValid) {
      delete newErrors[rowIndex];
      toast.success(`Row ${rowIndex + 1} is now valid!`);
    } else {
      newErrors[rowIndex] = updated[0].errors;
      toast.warning(`Row ${rowIndex + 1} has validation errors`);
    }
    setValidationErrors(newErrors);
    } finally {
      setRevalidatingRowIndex(null);
    }
  };

  // Remove row
  const handleRemoveRow = (rowIndex: number) => {
    const updatedData = validatedData
      .filter((_, index) => index !== rowIndex)
      .map((record, newIndex) => ({
        ...record,
        index: newIndex,
      }));
    
    const updatedErrors = { ...validationErrors };
    delete updatedErrors[rowIndex];

    const reindexedErrors: { [key: number]: string[] } = {};
    Object.entries(updatedErrors).forEach(([key, value]) => {
      const oldIndex = parseInt(key);
      const newIndex = oldIndex > rowIndex ? oldIndex - 1 : oldIndex;
      if (newIndex >= 0) {
        reindexedErrors[newIndex] = value;
      }
    });

    setValidatedData(updatedData);
    setValidationErrors(reindexedErrors);
    toast.success("Row removed");
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!validatedData.length) {
      toast.error("No data to upload");
      return;
    }

    const validRecords = validatedData.filter((record) => record.isValid);
    const invalidCount = validatedData.length - validRecords.length;

    if (invalidCount > 0) {
      toast.error(
        `Please fix ${invalidCount} validation errors before uploading`
      );
      return;
    }

    if (validRecords.length === 0) {
      toast.error("No valid records to upload");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadData = validRecords.map((record) => ({
        storeName: record.storeName.trim(),
        storeAddress: record.storeAddress.trim(),
        storePhone: record.storePhone,
        storePincode: record.storePincode,
        storeCountry: record.storeCountry || "India",
        storeState: record.storeState.trim(),
        storeCity: record.storeCity.trim(),
      }));

      const response = await fetch("/api/brand/stores/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ stores: uploadData }),
      });

      const result = await response.json();
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload stores");
      }

      toast.success(
        `Successfully uploaded ${result.data?.created || validRecords.length} stores!`
      );

      // Reset states
      setUploadedFile(null);
      setParsedData([]);
      setValidatedData([]);
      setValidationErrors({});
      setShowValidationTable(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error during bulk upload:", error);
      toast.error(error.message || "Failed to upload stores");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle modal close - clean all data
  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset all states when modal closes
      setUploadedFile(null);
      setParsedData([]);
      setValidatedData([]);
      setValidationErrors({});
      setShowValidationTable(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-h-[90vh] overflow-auto w-[80vw]! max-w-[80vw]!">
        <DialogHeader>
          <DialogTitle>Bulk Add Stores</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple stores at once. Review and edit
            any validation errors before uploading.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="cursor-pointer"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: CSV • Maximum 100 stores
            </p>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">File Format Requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Required: Store Name, Store Address, Store Pincode</li>
              <li>• Optional: City, State (from CSV or click Revalidate button)</li>
              <li>• Store Phone: 10 digits (optional)</li>
              <li>• Pincode: Exactly 6 digits</li>
              <li>• If address has commas, wrap in quotes: "Ramjas Road, Karol Bagh"</li>
              <li>• Click ↻ (Revalidate) to fetch city/state from pincode</li>
              <li>• No duplicate store name + address combinations</li>
            </ul>
          </div>

          {uploadedFile && !showValidationTable && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-medium text-blue-800">
                Processing: {uploadedFile.name}
              </p>
              <p className="text-xs text-blue-700">Validating stores...</p>
            </div>
          )}

          {/* Validation Table */}
          {showValidationTable && validatedData.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">
                  Data Preview & Validation ({validatedData.length} stores)
                </h4>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBulkRevalidate}
                    disabled={isRevalidating || isFetchingPincodes || isUploading}
                    size="sm"
                    variant="outline"
                  >
                    {isRevalidating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Revalidating...
                      </>
                    ) : (
                      "Revalidate All"
                    )}
                  </Button>
                  <Button
                    onClick={handleBulkFetchPincodes}
                    disabled={isRevalidating || isFetchingPincodes || isUploading}
                    size="sm"
                    variant="outline"
                  >
                    {isFetchingPincodes ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      "Fetch Pincodes"
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Valid: {validatedData.filter((r) => r.isValid).length} |
                    Errors: {Object.keys(validationErrors).length}
                  </div>
                </div>
              </div>

              <div className="border rounded-md max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 border-b w-8">#</th>
                      <th className="text-left p-2 border-b">Store Name</th>
                      <th className="text-left p-2 border-b">Address</th>
                      <th className="text-left p-2 border-b">Phone</th>
                      <th className="text-left p-2 border-b">Pincode</th>
                      <th className="text-left p-2 border-b">Country</th>
                      <th className="text-left p-2 border-b">State</th>
                      <th className="text-left p-2 border-b">City</th>
                      <th className="text-left p-2 border-b">Status</th>
                      <th className="text-left p-2 border-b w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedData.map((record, index) => {
                      const hasErrors = validationErrors[index];
                      const isRedRow = hasErrors || record.isDuplicate || record.existsInDB;

                      return (
                        <tr
                          key={record.id}
                          className={
                            isRedRow
                              ? "bg-red-50 border-red-200 text-black"
                              : "bg-green-50 border-green-200 text-black"
                          }
                        >
                          <td className="p-2 border-b text-xs">{index + 1}</td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.storeName}
                              onBlur={(e) =>
                                handleCellEdit(index, "storeName", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.storeAddress}
                              onBlur={(e) =>
                                handleCellEdit(index, "storeAddress", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.storePhone}
                              onBlur={(e) =>
                                handleCellEdit(index, "storePhone", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.storePincode}
                              onBlur={(e) => {
                                handleCellEdit(index, "storePincode", e.target.value);
                                handlePincodeBlur(index, e.target.value);
                              }}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              value={record.storeCountry}
                              onChange={(e) =>
                                handleCellEdit(index, "storeCountry", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              value={record.storeState}
                              onChange={(e) =>
                                handleCellEdit(index, "storeState", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              value={record.storeCity}
                              onChange={(e) =>
                                handleCellEdit(index, "storeCity", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            {hasErrors || record.isDuplicate || record.existsInDB ? (
                              <div className="text-xs text-red-600">
                                {record.errors.map((error, i) => (
                                  <div key={i}>• {error}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Valid
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-b">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevalidateRow(index)}
                                disabled={revalidatingRowIndex === index}
                                className="h-6 w-6 p-0 text-blue-500"
                                title="Revalidate"
                              >
                                {revalidatingRowIndex === index ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "↻"
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveRow(index)}
                                className="h-6 w-6 p-0 text-red-500"
                                title="Remove"
                              >
                                ×
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Download a sample file{" "}
            <a
              href="/samples/bulk-stores-sample.csv"
              download
              className="text-blue-600 underline hover:text-blue-800"
            >
              here
            </a>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isUploading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleBulkUpload}
            disabled={
              !validatedData.length ||
              Object.keys(validationErrors).length > 0 ||
              isUploading
            }
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${validatedData.filter((r) => r.isValid).length} Stores`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
