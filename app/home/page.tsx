"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoaderWithText } from "@/components/ui/Loader";
import { useAuth, useProtectedRoute } from "@/lib/context/AuthContext";
import { CheckCircle, XCircle, Phone, Mail, User, Calendar, Shield } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  userType: "brand" | "vendor";
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const { user, accessToken, logout } = useAuth();
  const { isLoading: authLoading } = useProtectedRoute();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API
  const fetchUserData = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      setUserData(data.user);
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchUserData();
    }
  }, [user, accessToken]);

  // Show loading spinner while checking auth status
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderWithText text="Loading..." position="right" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Profile</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <div className="space-x-2">
                <Button onClick={fetchUserData} variant="outline">
                  Try Again
                </Button>
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Signagewala</h1>
            </div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'User'}!
            </h2>
            <p className="text-muted-foreground">
              Here's your profile information and account status.
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <LoaderWithText text="Loading profile..." position="right" />
                </div>
              </CardContent>
            </Card>
          ) : userData ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>
                    Your personal details and verification status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Name</span>
                    <span className="text-muted-foreground">{userData.name}</span>
                  </div>
                  
                  <Separator />
                  
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{userData.email}</span>
                      {userData.isEmailVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Phone */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">{userData.phone}</span>
                      {userData.isPhoneVerified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* User Type */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User Type</span>
                    <Badge variant="outline">
                      {userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1)}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  {/* Account Creation Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Member Since</span>
                    </div>
                    <span className="text-muted-foreground">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>
                    Your verification status and account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userData.isEmailVerified && userData.isPhoneVerified ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Account Fully Verified</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-amber-600">
                        <XCircle className="h-5 w-5" />
                        <span className="font-medium">Account Partially Verified</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Please verify your {!userData.isEmailVerified ? 'email' : ''} 
                        {!userData.isEmailVerified && !userData.isPhoneVerified ? ' and ' : ''}
                        {!userData.isPhoneVerified ? 'phone number' : ''} to complete your profile.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}