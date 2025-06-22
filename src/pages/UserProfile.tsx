import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Upload, 
  Trash2, 
  Edit,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

// Interface for profile image data
interface ProfileImage {
  id: number;
  user_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  url?: string; // For display
}

const UserProfile = () => {
  const { user, loading, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form states - ONLY registration fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  // UI states
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Profile image states
  const [profileImage, setProfileImage] = useState<ProfileImage | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Get user metadata
      const metadata = user.user_metadata || {};
      
      setFirstName(metadata.first_name || "");
      setLastName(metadata.last_name || "");
      setEmail(user.email || "");
      setPhone(metadata.phone || "");
      
      // Load profile image
      loadProfileImage();
    }
  }, [user]);

  // Load profile image from database
  const loadProfileImage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profile_images')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        // Get public URL for the image
        const { data: urlData } = await supabase.storage
          .from('profile-images')
          .getPublicUrl(data.storage_path);

        setProfileImage({
          ...data,
          url: urlData.publicUrl
        });
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };
  
  // Check if form has changes - ONLY for registration fields
  useEffect(() => {
    if (!user) return;
    
    const metadata = user.user_metadata || {};
    
    const hasFormChanges = 
      firstName !== (metadata.first_name || "") ||
      lastName !== (metadata.last_name || "") ||
      phone !== (metadata.phone || "");
      
    setHasChanges(hasFormChanges);
  }, [firstName, lastName, phone, user]);
  
  // If not logged in, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login/", { replace: true });
    }
  }, [loading, user, navigate]);

  // Handle file selection for profile image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or WebP image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the image
    uploadProfileImage(file);
  };

  // Upload profile image to Supabase
  const uploadProfileImage = async (file: File) => {
    if (!user) return;

    setIsUploadingImage(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `profile_${user.id}_${uuidv4().substring(0, 8)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Deactivate current profile image if exists
      if (profileImage) {
        await supabase
          .from('profile_images')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      setUploadProgress(25);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      // Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('profile_images')
        .insert({
          user_id: user.id,
          storage_path: filePath,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadProgress(100);

      // Get public URL and update state
      const { data: urlData } = await supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setProfileImage({
        ...dbData,
        url: urlData.publicUrl
      });

      setPreviewImage(null);

      toast({
        title: "Profile image updated",
        description: "Your profile image has been successfully updated.",
      });

    } catch (error) {
      console.error('Error uploading profile image:', error);
      setPreviewImage(null);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete profile image
  const deleteProfileImage = async () => {
    if (!user || !profileImage) return;

    setIsDeletingImage(true);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-images')
        .remove([profileImage.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('profile_images')
        .delete()
        .eq('id', profileImage.id);

      if (dbError) throw dbError;

      setProfileImage(null);

      toast({
        title: "Profile image deleted",
        description: "Your profile image has been removed.",
      });

    } catch (error) {
      console.error('Error deleting profile image:', error);
      toast({
        title: "Delete failed",
        description: "There was a problem deleting your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingImage(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#f74f4f]" />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect via useEffect
  }
  
  // Function to get user initials for avatar fallback
  const getUserInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };
  
  // Handle form submission - ONLY for registration fields
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    setIsUpdating(true);
    
    try {
      // Update user metadata - ONLY registration fields
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });
      
      // Also update localStorage values if they exist
      if (firstName) localStorage.setItem("userFirstName", firstName);
      if (lastName) localStorage.setItem("userLastName", lastName);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account information
            </p>
          </div>
          
          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and profile image.
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative group">
                        <Avatar className="w-32 h-32">
                          {(profileImage?.url || previewImage) ? (
                            <AvatarImage 
                              src={previewImage || profileImage?.url} 
                              alt="Profile"
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-2xl bg-[#f74f4f]/10 text-[#f74f4f]">
                              {getUserInitials()}
                            </AvatarFallback>
                          )}
                          
                          {/* Loading overlay */}
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                              <div className="text-center text-white">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                <div className="text-xs">{uploadProgress}%</div>
                              </div>
                            </div>
                          )}
                        </Avatar>
                        
                        {/* Edit overlay on hover */}
                        {!isUploadingImage && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
                               onClick={triggerFileInput}>
                            <Camera className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Upload progress */}
                      {isUploadingImage && uploadProgress > 0 && (
                        <div className="w-32">
                          <Progress value={uploadProgress} className="h-2" />
                        </div>
                      )}
                      
                      {/* Image info */}
                      {profileImage && (
                        <div className="text-center text-sm text-gray-500">
                          <p>{profileImage.file_name}</p>
                          <p>{formatFileSize(profileImage.file_size)}</p>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={triggerFileInput}
                          disabled={isUploadingImage}
                          className="flex items-center gap-1"
                        >
                          {profileImage ? <Edit className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                          {profileImage ? 'Change' : 'Upload'}
                        </Button>
                        
                        {profileImage && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={isDeletingImage || isUploadingImage}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            {isDeletingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      {/* File requirements */}
                      <div className="text-xs text-gray-500 text-center">
                        <p>JPG, PNG or WebP</p>
                        <p>Max size: 5MB</p>
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </div>
                    
                    {/* Profile Form - ONLY registration fields */}
                    <form onSubmit={handleSubmit} className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First name</Label>
                          <div className="flex">
                            <User className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="firstName" 
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              placeholder="Enter your first name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <div className="flex">
                            <User className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="lastName" 
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              placeholder="Enter your last name"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="flex">
                            <Mail className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="email" 
                              type="email"
                              value={email}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed directly
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone number</Label>
                          <div className="flex">
                            <Phone className="w-4 h-4 text-gray-500 mr-2 mt-3" />
                            <Input 
                              id="phone" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="Enter your phone number"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          type="submit"
                          className="bg-[#f74f4f] hover:bg-[#e43c3c]"
                          disabled={isUpdating || !hasChanges}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="space-y-6">
              {/* Account Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account security and preferences
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Change Password</h3>
                    <p className="text-muted-foreground mb-4">
                      Update your password to keep your account secure
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/forgot-password/")}
                    >
                      Reset Password
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium mb-2 text-red-500">Danger Zone</h3>
                    <p className="text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your profile image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingImage}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProfileImage}
              disabled={isDeletingImage}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Image'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default UserProfile;