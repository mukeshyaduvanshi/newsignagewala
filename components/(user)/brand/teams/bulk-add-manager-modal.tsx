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

interface BulkAddManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  managerType: string;
  uniqueKey: string;
}

interface ManagerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  managerType: string;
  index: number;
  errors: string[];
  isValid: boolean;
  isDuplicate?: boolean;
  existsInDB?: boolean;
}

export function BulkAddManagerModal({
  open,
  onOpenChange,
  onSuccess,
  managerType,
  uniqueKey,
}: BulkAddManagerModalProps) {
  const { accessToken,user } = useAuth();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validatedData, setValidatedData] = useState<ManagerRecord[]>([]);
  const [showValidationTable, setShowValidationTable] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<{
    [key: number]: string[];
  }>({});
  const [sendEmail, setSendEmail] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [revalidatingRowIndex, setRevalidatingRowIndex] = useState<number | null>(null);

  // Parse CSV with proper handling of quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
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
            row[header] = values[index].replace(/^["']|["']$/g, "");
          }
        });

        const mappedRow = {
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          name: row.name || values[0]?.replace(/^["']|["']$/g, "") || "",
          email: row.email || values[1]?.replace(/^["']|["']$/g, "") || "",
          phone: row.phone || values[2]?.replace(/^["']|["']$/g, "") || "",
          managerType: managerType,
        };

        data.push(mappedRow);
      }
    }
    return data;
  };

  // Validate individual record
  const validateRecord = (record: any, index: number): ManagerRecord => {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!record.name || record.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }

    if (!record.email || !emailRegex.test(record.email.trim())) {
      errors.push("Invalid email format");
    }

    const cleanPhone = record.phone?.replace(/\D/g, "");
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      errors.push("Phone must be 10 digits");
    }

    return {
      ...record,
      phone: cleanPhone || record.phone,
      index,
      errors,
      isValid: errors.length === 0,
    };
  };

  // Check for duplicates within upload and in database
  const checkDuplicates = async (data: ManagerRecord[]) => {
    // Check internal duplicates (email + phone)
    const emailMap = new Map();
    const phoneMap = new Map();
    const duplicateIndexes = new Set();

    data.forEach((record, index) => {
      if (record.email) {
        if (emailMap.has(record.email.toLowerCase())) {
          duplicateIndexes.add(index);
          duplicateIndexes.add(emailMap.get(record.email.toLowerCase()));
        } else {
          emailMap.set(record.email.toLowerCase(), index);
        }
      }

      if (record.phone) {
        const cleanPhone = record.phone.replace(/\D/g, "");
        if (phoneMap.has(cleanPhone)) {
          duplicateIndexes.add(index);
          duplicateIndexes.add(phoneMap.get(cleanPhone));
        } else {
          phoneMap.set(cleanPhone, index);
        }
      }
    });

    // Check database for existing managers
    try {
      const response = await fetch("/api/teams/members/check-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          managers: data.map((r) => ({
            email: r.email,
            phone: r.phone,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const existingKeys = new Set(result.data.existingKeys || []);

        data.forEach((record, index) => {
          const emailKey = `email:${record.email.toLowerCase()}`;
          const phoneKey = `phone:${record.phone}`;
          
          if (existingKeys.has(emailKey) || existingKeys.has(phoneKey)) {
            record.existsInDB = true;
            record.errors.push("Manager already exists in database");
            record.isValid = false;
          }
          if (duplicateIndexes.has(index)) {
            record.isDuplicate = true;
            record.errors.push("Duplicate email or phone in upload");
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
    setValidatedData([]);
    setValidationErrors({});

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast.error("No valid data found in the CSV file");
        return;
      }

      if (parsed.length > 500) {
        toast.error("Maximum 500 records allowed per upload");
        return;
      }

      let validated = parsed.map((record, index) =>
        validateRecord(record, index)
      );

      // Check duplicates (internal + database)
      validated = await checkDuplicates(validated);

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
          `${invalidCount} records have validation errors. Please fix them before uploading.`
        );
      } else {
        toast.success(
          `All ${validCount} records are valid and ready for upload!`
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

  // Bulk revalidate all rows
  const handleBulkRevalidate = async () => {
    setIsRevalidating(true);
    try {
      let revalidatedData = validatedData.map((record, index) => 
        validateRecord(record, index)
      );

      // Check duplicates (internal + database)
      revalidatedData = await checkDuplicates(revalidatedData);

      const errors: { [key: number]: string[] } = {};
      revalidatedData.forEach((record) => {
        if (!record.isValid) {
          errors[record.index] = record.errors;
        }
      });

      setValidatedData(revalidatedData);
      setValidationErrors(errors);

      const validCount = revalidatedData.filter((r) => r.isValid).length;
      const invalidCount = revalidatedData.length - validCount;

      if (invalidCount > 0) {
        toast.warning(`${invalidCount} records have validation errors`);
      } else {
        toast.success(`All ${validCount} records are valid!`);
      }
    } catch (error) {
      console.error("Error during bulk revalidation:", error);
      toast.error("Error during revalidation");
    } finally {
      setIsRevalidating(false);
    }
  };

  // Revalidate individual row
  const handleRevalidateRow = async (rowIndex: number) => {
    setRevalidatingRowIndex(rowIndex);
    try {
      const record = validatedData[rowIndex];
      let revalidated = validateRecord(record, rowIndex);

      // Check duplicates for this row
      const tempData = [...validatedData];
      tempData[rowIndex] = revalidated;
      const checkedData = await checkDuplicates(tempData);
      revalidated = checkedData[rowIndex];

      const updatedData = [...validatedData];
      updatedData[rowIndex] = revalidated;
      setValidatedData(updatedData);

      const newErrors = { ...validationErrors };
      if (revalidated.isValid) {
        delete newErrors[rowIndex];
        toast.success(`Row ${rowIndex + 1} is now valid!`);
      } else {
        newErrors[rowIndex] = revalidated.errors;
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
        name: record.name.trim(),
        email: record.email.trim().toLowerCase(),
        phone: record.phone,
        managerType: managerType,
        uniqueKey: uniqueKey,
        sendEmail: sendEmail,
      }));

      const url = user?.userType === "brand" ? "/api/teams/members/bulk" : "/api/teams/members/bulk-by-manager";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ members: uploadData, parentId: user?.parentId || "" }),
      });

      const result = await response.json();
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload managers");
      }

      toast.success(
        `Successfully uploaded ${
          result.data?.created || validRecords.length
        } managers!`
      );

      // Reset states
      setUploadedFile(null);
      setValidatedData([]);
      setValidationErrors({});
      setShowValidationTable(false);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error during bulk upload:", error);
      toast.error(error.message || "Failed to upload managers");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle modal close
  const handleModalClose = (isOpen: boolean) => {
    if (!isOpen) {
      setUploadedFile(null);
      setValidatedData([]);
      setValidationErrors({});
      setShowValidationTable(false);
      setIsUploading(false);
      setUploadProgress(0);
      setSendEmail(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-h-[90vh] overflow-auto w-[80vw]! max-w-[80vw]!">
        <DialogHeader>
          <DialogTitle>Bulk Add {managerType}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple {managerType.toLowerCase()} at once. Review and edit
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
              Supported formats: CSV • Maximum 500 records
            </p>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">File Format Requirements:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Required columns: Name, Email, Phone</li>
              <li>• Name: Minimum 2 characters</li>
              <li>• Email: Valid email format</li>
              <li>• Phone: Exactly 10 digits</li>
              <li>• If name/email has commas, wrap in quotes: "Kumar, Rajesh"</li>
              <li>• No duplicate emails or phone numbers</li>
            </ul>
          </div>

          {uploadedFile && !showValidationTable && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-medium text-blue-800">
                Processing: {uploadedFile.name}
              </p>
              <p className="text-xs text-blue-700">Validating records...</p>
            </div>
          )}

          {/* Validation Table */}
          {showValidationTable && validatedData.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">
                  Data Preview & Validation ({validatedData.length} records)
                </h4>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleBulkRevalidate}
                    disabled={isRevalidating || isUploading}
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
                      <th className="text-left p-2 border-b">Name</th>
                      <th className="text-left p-2 border-b">Email</th>
                      <th className="text-left p-2 border-b">Phone</th>
                      <th className="text-left p-2 border-b">Status</th>
                      <th className="text-left p-2 border-b w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedData.map((record, index) => {
                      const hasErrors = validationErrors[index];
                      const isRedRow = hasErrors || record.isDuplicate;
                      const isOrangeRow = record.existsInDB;

                      return (
                        <tr
                          key={record.id}
                          className={
                            isOrangeRow
                              ? "bg-orange-50 border-orange-200 text-black"
                              : isRedRow
                              ? "bg-red-50 border-red-200 text-black"
                              : "bg-green-50 border-green-200 text-black"
                          }
                        >
                          <td className="p-2 border-b text-xs">{index + 1}</td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.name}
                              onBlur={(e) =>
                                handleCellEdit(index, "name", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.email}
                              onBlur={(e) =>
                                handleCellEdit(index, "email", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            <Input
                              defaultValue={record.phone}
                              onBlur={(e) =>
                                handleCellEdit(index, "phone", e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 border-b">
                            {hasErrors ? (
                              <div className="text-xs text-red-600">
                                {hasErrors.map((error, i) => (
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
              href="/samples/bulk-managers-sample.csv"
              download
              className="text-blue-600 underline hover:text-blue-800"
            >
              here
            </a>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendEmail"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
              disabled={isUploading}
            />
            <Label htmlFor="sendEmail" className="text-sm cursor-pointer">
              Send email notifications
            </Label>
          </div>

          <div className="flex gap-2">
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
                `Upload ${validatedData.filter((r) => r.isValid).length} Managers`
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
