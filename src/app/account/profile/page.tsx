"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  User,
  ShoppingBag,
  Heart,
  Save,
  ShieldCheck,
  Mail,
  Phone,
  CalendarDays,
  Users,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  Gift,
  Zap,
  Crown,
  Camera,
  Loader2,
} from "lucide-react";

import { toast } from "react-toastify";
import { api, extractErrorMessage } from "@/app/api/api";
import { authApi } from "@/app/api/services";

// =====================================================
// TYPES
// =====================================================

type Gender = "" | "Male" | "Female" | "Other" | "Prefer not to say";

interface ProfileForm {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  avatarUrl: string;
}

interface ApiProfileResponse {
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  avatarUrl?: string;
  profileImage?: string;
  isActive?: boolean;
  isVerified?: boolean;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

type FormErrors = Partial<Record<keyof ProfileForm, string>>;

// =====================================================
// CONSTANTS
// =====================================================

const INITIAL_PROFILE: ProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  avatarUrl: "",
};

const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÿ\s.'-]+$/;
const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_PROFILE_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// =====================================================
// DATE VALIDATION
// =====================================================

const isValidDate = (date: string) => {
  if (!date) return true;
  const selectedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime())) return false;
  const today = new Date();
  if (selectedDate > today) return false;
  const minimumDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  if (selectedDate < minimumDate) return false;
  return true;
};

// =====================================================
// PROFILE VALIDATION
// =====================================================

const validateProfile = (values: ProfileForm): FormErrors => {
  const errors: FormErrors = {};

  const name = values.fullName.trim();
  if (!name) {
    errors.fullName = "Full name is required.";
  } else if (name.length < 2) {
    errors.fullName = "Full name must contain at least 2 characters.";
  } else if (name.length > 50) {
    errors.fullName = "Full name cannot exceed 50 characters.";
  } else if (!NAME_REGEX.test(name)) {
    errors.fullName = "Please enter a valid name.";
  } else if (!/[A-Za-zÀ-ÿ]/.test(name)) {
    errors.fullName = "Please enter a valid name.";
  }

  const email = values.email.trim().toLowerCase();
  if (!email) {
    errors.email = "Email address is required.";
  } else if (email.length > 100) {
    errors.email = "Email address cannot exceed 100 characters.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  const phone = values.phone.replace(/\s+/g, "").trim();
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else {
    const normalizedPhone = phone.replace(/^(\+91|91)/, "");
    if (!PHONE_REGEX.test(normalizedPhone)) {
      errors.phone = "Enter a valid 10-digit Indian mobile number starting with 6-9.";
    }
  }

  if (values.dateOfBirth && !isValidDate(values.dateOfBirth)) {
    const today = new Date();
    const selectedDate = new Date(`${values.dateOfBirth}T00:00:00`);
    if (selectedDate > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    } else {
      errors.dateOfBirth = "Please enter a valid date of birth.";
    }
  }

  const validGenders: Gender[] = ["", "Male", "Female", "Other", "Prefer not to say"];
  if (!validGenders.includes(values.gender)) {
    errors.gender = "Please select a valid gender.";
  }

  return errors;
};

// =====================================================
// PAGE
// =====================================================

export default function ProfilePage() {
  const router = useRouter();

  // STATE
  const [form, setForm] = useState<ProfileForm>(INITIAL_PROFILE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [userId, setUserId] = useState<string | number | null>(null);

  // =====================================================
  // GET AUTH TOKEN
  // =====================================================

  const getAuthToken = (): string | null => {
    try {
      return sessionStorage.getItem("accessToken");
    } catch (e) {
      console.error("Failed to get auth token:", e);
      return null;
    }
  };

  // =====================================================
  // GET USER ID FROM SESSION
  // =====================================================

  const getUserId = (): string | number | null => {
    try {
      // Try to get from session storage
      let userIdFromSession = sessionStorage.getItem("aanzara_user_id");
      if (userIdFromSession) {
        return userIdFromSession;
      }

      // Try to get from auth data in session
      const authData = sessionStorage.getItem("aanzara_auth_data");
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed?.user?.userId) {
          return parsed.user.userId;
        }
        if (parsed?.data?.user?.userId) {
          return parsed.data.user.userId;
        }
        if (parsed?.userId) {
          return parsed.userId;
        }
        if (parsed?.userId) {
          return parsed.userId;
        }
      }

      // Try to get user data from session
      const userData = sessionStorage.getItem("aanzara_user_data");
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed?.userId) {
          return parsed.userId;
        }
      }

      return null;
    } catch (e) {
      console.error("Failed to get user ID:", e);
      return null;
    }
  };

  // =====================================================
  // FETCH PROFILE FROM API
  // =====================================================

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError("");

      const token = getAuthToken();
      
      if (!token) {
        // No token found, redirect to login
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
        setIsLoading(false);
        return;
      }

      // Set the authorization header for all subsequent API calls
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // First try to get user data from /me endpoint — GET /api/v1/auth/me
      try {
        const meResponse = await authApi.me();
        // AuthUser is a subset of ApiProfileResponse; cast for form mapping
        const meData = meResponse.data as unknown as ApiProfileResponse;
        
        if (meData?.userId) {
          const userIdValue = meData.userId;
          setUserId(userIdValue);
          
          // Save to session for future use
          sessionStorage.setItem("aanzara_user_id", String(userIdValue));
          
          // Populate form from /me response
          const profileForm = mapApiDataToForm(meData);
          setForm(profileForm);
          
          // Save user data to session
          sessionStorage.setItem("aanzara_user_data", JSON.stringify({
            userId: userIdValue,
            name: profileForm.fullName,
            email: profileForm.email,
            phone: profileForm.phone,
            roles: meData.roles ?? [],
            avatarUrl: profileForm.avatarUrl,
          }));
          
          setIsLoading(false);
          return;
        }
      } catch (meError: any) {
        console.error("Failed to fetch /me:", meError);
        
        // If 401, redirect to login
        if (meError?.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          setTimeout(() => {
            router.push("/login");
          }, 1500);
          setIsLoading(false);
          return;
        }
        // Continue to try other methods
      }

      // If /me failed, try to get user ID from session
      const id = getUserId();

      if (!id) {
        throw new Error("User not authenticated. Please login again.");
      }

      setUserId(id);

      // /auth/me is the only profile source; retry it once before failing.
      const meResponse = await authApi.me();
      const userData = meResponse.data as unknown as ApiProfileResponse;

      if (!userData || !userData.userId) {
        throw new Error("Failed to load user data");
      }

      // Map API response to form
      const profileForm = mapApiDataToForm(userData);
      setForm(profileForm);

      // Update session storage with latest user data
      const userRole = sessionStorage.getItem("aanzara_user_role") || "customer";
      sessionStorage.setItem("aanzara_user_data", JSON.stringify({
        id: id,
        name: profileForm.fullName,
        email: profileForm.email,
        phone: profileForm.phone,
        role: userRole,
        avatarUrl: profileForm.avatarUrl,
      }));

    } catch (err) {
      console.error("Failed to fetch profile:", err);
      const errorMsg = extractErrorMessage(err, "Failed to load profile. Please try again.");
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeAvatarUrl = (url?: string | null): string => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    // Stored URLs may be absolute LAN http://192.168.31.9:5000/uploads/... — convert to proxied /uploads/...
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const u = new URL(trimmed);
        const idx = u.pathname.indexOf("/uploads/");
        if (idx !== -1) return u.pathname.substring(idx);
        return u.pathname;
      } catch {
        const idx = trimmed.indexOf("/uploads/");
        if (idx !== -1) return trimmed.substring(idx);
      }
    }
    return trimmed;
  };

  // =====================================================
  // MAP API DATA TO FORM
  // =====================================================

  const mapApiDataToForm = (userData: ApiProfileResponse): ProfileForm => {
    let fullName = userData.name || "";
    if (!fullName && userData.firstName) {
      fullName = userData.firstName;
      if (userData.lastName) {
        fullName += ` ${userData.lastName}`;
      }
    }

    let phone = userData.phone || userData.mobile || "";
    // Format phone number
    if (phone && !phone.startsWith("+") && phone.length === 10) {
      phone = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }

    let gender: Gender = "";
    if (userData.gender) {
      const g = userData.gender.toLowerCase();
      if (g === "male") gender = "Male";
      else if (g === "female") gender = "Female";
      else if (g === "other") gender = "Other";
      else if (g === "prefer not to say") gender = "Prefer not to say";
    }

    return {
      fullName: fullName || "User",
      email: userData.email || "",
      phone: phone || "",
      dateOfBirth: userData.dateOfBirth || "",
      gender: gender,
      avatarUrl: normalizeAvatarUrl(userData.avatarUrl || userData.profileImage || ""),
    };
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =====================================================
  // PROFILE COMPLETION
  // =====================================================

  const profileCompletion = useMemo(() => {
    const fields = [
      form.fullName.trim(),
      form.email.trim(),
      form.phone.trim(),
      form.dateOfBirth,
      form.gender,
      form.avatarUrl,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [form]);

  // =====================================================
  // AVATAR LETTER
  // =====================================================

  const avatarLetter = form.fullName.trim().charAt(0).toUpperCase() || "U";

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = <K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K]
  ) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    setSuccess("");
    setError("");

    if (touched[field]) {
      const validationErrors = validateProfile(nextForm);
      setErrors((current) => ({ ...current, [field]: validationErrors[field] }));
    }
  };

  // =====================================================
  // BLUR VALIDATION
  // =====================================================

  const handleBlur = (field: keyof ProfileForm) => {
    setTouched((current) => ({ ...current, [field]: true }));
    const validationErrors = validateProfile(form);
    setErrors((current) => ({ ...current, [field]: validationErrors[field] }));
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setImageError("");
    setSuccess("");
    setError("");

    if (!file) return;

    const fileExtension = file.name.includes(".")
      ? `.${file.name.split(".").pop()?.toLowerCase()}`
      : "";

    const validMimeType = ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type);
    const validExtension = ALLOWED_PROFILE_IMAGE_EXTENSIONS.includes(fileExtension);

    if (!validMimeType || !validExtension) {
      setImageError("Please upload a JPG, JPEG, PNG or WEBP image.");
      setImageInputKey((current) => current + 1);
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setImageError("Image size must be 2 MB or less.");
      setImageInputKey((current) => current + 1);
      return;
    }

    try {
      const token = getAuthToken();
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Upload image to server — POST /api/v1/auth/me/avatar
      const response = await authApi.uploadAvatar(file);

      const payload = response.data as unknown as Record<string, unknown>;
      const nested = payload?.data as Record<string, unknown> | undefined;
      const rawAvatarUrl =
        (nested?.avatarUrl as string | undefined) ??
        (nested?.AvatarUrl as string | undefined) ??
        (payload?.avatarUrl as string | undefined) ??
        (payload?.AvatarUrl as string | undefined) ??
        (payload?.url as string | undefined) ??
        (payload?.Url as string | undefined);
      const avatarUrl = normalizeAvatarUrl(rawAvatarUrl);
      
      if (avatarUrl) {
        setForm((current) => ({ ...current, avatarUrl }));
        setSuccess("Profile image updated successfully.");
        toast.success("Profile image updated!");
        
        // Update session storage
        const userData = sessionStorage.getItem("aanzara_user_data");
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            parsed.avatarUrl = avatarUrl;
            sessionStorage.setItem("aanzara_user_data", JSON.stringify(parsed));
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to upload image:", err);
      const errorMsg = extractErrorMessage(err, "Failed to upload image.");
      setImageError(errorMsg);
      toast.error(errorMsg);
    }

    setImageInputKey((current) => current + 1);
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess("");
    setError("");

    const validationErrors = validateProfile(form);
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      setError("Please fix the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const token = getAuthToken();
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      const cleanProfile = {
        name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\s+/g, "").trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        avatarUrl: form.avatarUrl || undefined,
      };

      // Update profile via API — PUT /api/v1/auth/me
      await authApi.updateMe(cleanProfile);

      setSuccess("Your profile has been updated successfully.");
      toast.success("Profile updated successfully!");

      // Update session storage
      const userData = sessionStorage.getItem("aanzara_user_data");
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          parsed.name = cleanProfile.name;
          parsed.email = cleanProfile.email;
          parsed.phone = cleanProfile.phone;
          sessionStorage.setItem("aanzara_user_data", JSON.stringify(parsed));
        } catch (e) {
          // Ignore parse errors
        }
      }

      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      
      // Check if it's a 401 error
      if ((err as any)?.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        const errorMsg = extractErrorMessage(err, "Unable to save your profile. Please try again.");
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#E53935]">
        <XCircle size={12} />
        {message}
      </p>
    );
  };

  const getInputClass = (field: keyof ProfileForm) => {
    const hasError = touched[field] && errors[field];
    return `h-[52px] w-full rounded-[12px] border bg-white px-4 text-[14px] text-[#102D62] outline-none transition placeholder:text-[#9AA9BF] ${
      hasError
        ? "border-[#EF4444] bg-[#FFF9F9] focus:border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/10"
        : "border-[#D9E2EE] focus:border-[#1769F5] focus:ring-4 focus:ring-[#1769F5]/10"
    }`;
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1769F5]" />
          <p className="mt-4 text-[13px] font-medium text-[#718096]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <>
      {/* BREADCRUMB */}
      <div
        className="mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[13px]"
        aria-label="Breadcrumb"
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[#1769F5] hover:underline"
        >
          Home
        </button>
        <span className="text-[#9AA9BF]">›</span>
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="text-[#718096] hover:text-[#1769F5]"
        >
          My Account
        </button>
        <span className="text-[#9AA9BF]">›</span>
        <strong className="font-semibold text-[#102D62]">Profile Information</strong>
      </div>

      {/* PAGE TITLE */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#102D62] transition hover:bg-white hover:shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#102D62] sm:text-[34px]">
              Profile Information
            </h1>
            <p className="mt-1 text-[13px] text-[#718096] sm:text-[14px]">
              Manage your personal details and keep your information up to date.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/account")}
          className="hidden h-10 w-10 items-center justify-center rounded-full text-[28px] text-[#102D62] transition hover:bg-white hover:shadow-sm sm:flex"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* PROFILE FORM */}
        <section className="min-w-0 rounded-[20px] border border-[#E1E8F1] bg-white p-5 shadow-[0_12px_35px_rgba(30,72,130,0.05)] sm:p-7">
          {/* AVATAR */}
          <div className="flex flex-col items-center border-b border-[#EEF2F7] pb-6">
            <div className="relative">
              <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#E8F1FF] to-[#D9E8FF] text-[38px] font-bold text-[#1769F5]">
                {form.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Broken LAN URL or missing file → fall back to initial
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              <input
                key={imageInputKey}
                id="profile-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                onChange={handleImageUpload}
                className="hidden"
              />

              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#1769F5] text-white shadow-md transition hover:bg-[#0F5BDE]"
                title="Change profile photo"
              >
                <Camera size={15} />
              </label>
            </div>

            {imageError && (
              <p className="mt-2 max-w-[220px] text-center text-[10px] font-medium leading-4 text-[#EF4444]">
                {imageError}
              </p>
            )}

            <h2 className="mt-4 text-[21px] font-bold text-[#102D62]">
              {form.fullName || "User"}
            </h2>

            <p className="mt-1 max-w-full truncate px-2 text-center text-[13px] text-[#718096]">
              {form.email || "user@example.com"}
            </p>

            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-[#EAF9F0] px-3 py-1.5 text-[11px] font-semibold text-[#159447]">
              <CheckCircle2 size={14} />
              Verified Account
            </div>
          </div>

          {/* HEADER */}
          <div className="flex flex-col gap-5 border-b border-[#EEF2F7] py-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
                <User size={23} />
              </div>

              <div>
                <h2 className="text-[23px] font-bold tracking-[-0.02em] text-[#102D62]">
                  Profile Information
                </h2>
                <p className="mt-1 text-[13px] text-[#718096]">
                  Keep your information up to date for a better experience.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[13px] bg-[#EFF6FF] px-4 py-3">
              <ShieldCheck size={22} className="shrink-0 text-[#1769F5]" />
              <div>
                <p className="text-[11px] font-bold text-[#1769F5]">
                  Your information is secure
                </p>
                <p className="mt-0.5 text-[9px] text-[#718096]">
                  We keep your data safe and private.
                </p>
              </div>
            </div>
          </div>

          {/* SUCCESS / ERROR MESSAGES */}
          {success && (
            <div
              role="status"
              aria-live="polite"
              className="mt-5 flex items-center rounded-[12px] border border-[#B7E4C7] bg-[#EAF7EF] px-4 py-3"
            >
              <CheckCircle2 size={18} className="mr-2 shrink-0 text-[#159447]" />
              <p className="text-[12px] font-semibold text-[#159447]">{success}</p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-center rounded-[12px] border border-[#FECACA] bg-[#FFF2F2] px-4 py-3"
            >
              <XCircle size={18} className="mr-2 shrink-0 text-[#EF4444]" />
              <p className="text-[12px] font-medium text-[#D92D20]">{error}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} noValidate className="mt-7">
            {/* FULL NAME */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#102D62]"
              >
                <User size={16} />
                Full Name
                <span className="text-[#EF4444]">*</span>
              </label>

              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  maxLength={50}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className={`${getInputClass("fullName")} pr-16`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#9AA9BF]">
                  {form.fullName.length}/50
                </span>
              </div>
              <FieldError message={errors.fullName} />
            </div>

            {/* EMAIL + PHONE */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#102D62]"
                >
                  <Mail size={16} />
                  Email Address
                  <span className="text-[#EF4444]">*</span>
                </label>

                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onBlur={() => handleBlur("email")}
                    maxLength={100}
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className={`${getInputClass("email")} pr-16`}
                    disabled
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#9AA9BF]">
                    {form.email.length}/100
                  </span>
                </div>
                <FieldError message={errors.email} />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#102D62]"
                >
                  <Phone size={16} />
                  Phone Number
                  <span className="text-[#EF4444]">*</span>
                </label>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^\d+ ]/g, "");
                    updateField("phone", value);
                  }}
                  onBlur={() => handleBlur("phone")}
                  maxLength={14}
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  className={getInputClass("phone")}
                />
                <FieldError message={errors.phone} />
              </div>
            </div>

            {/* DOB + GENDER */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#102D62]"
                >
                  <CalendarDays size={16} />
                  Date of Birth
                  <span className="font-normal text-[#9AA9BF]">(Optional)</span>
                </label>

                <input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  onBlur={() => handleBlur("dateOfBirth")}
                  max={new Date().toISOString().split("T")[0]}
                  className={getInputClass("dateOfBirth")}
                />
                <FieldError message={errors.dateOfBirth} />
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#102D62]"
                >
                  <Users size={16} />
                  Gender
                  <span className="font-normal text-[#9AA9BF]">(Optional)</span>
                </label>

                <div className="relative">
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(event) => updateField("gender", event.target.value as Gender)}
                    onBlur={() => handleBlur("gender")}
                    className={`${getInputClass("gender")} appearance-none pr-12`}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#718096]"
                  />
                </div>
                <FieldError message={errors.gender} />
              </div>
            </div>

            {/* PROFILE COMPLETION */}
            <div className="mt-7 rounded-[14px] border border-[#E3EBF5] bg-[#F8FBFF] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-bold text-[#102D62]">Profile completion</p>
                  <p className="mt-1 text-[10px] text-[#718096]">
                    Complete your profile for a better shopping experience.
                  </p>
                </div>
                <span className="text-[14px] font-bold text-[#1769F5]">
                  {profileCompletion}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E4ECF7]">
                <div
                  className="h-full rounded-full bg-[#1769F5] transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 flex h-[54px] w-full items-center justify-center rounded-[12px] bg-[#1769F5] text-[14px] font-bold text-white shadow-[0_10px_25px_rgba(23,105,245,0.20)] transition hover:bg-[#0F5BDE] hover:shadow-[0_14px_30px_rgba(23,105,245,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => router.push("/account")}
              className="mx-auto mt-5 flex items-center justify-center text-[12px] font-semibold text-[#1769F5] hover:underline disabled:opacity-50"
            >
              <ArrowLeft size={14} className="mr-1" />
              Back to My Account
            </button>
          </form>
        </section>

        {/* RIGHT PROMOTIONAL CARD */}
        <aside className="hidden xl:block">
          <div className="sticky top-5 overflow-hidden rounded-[20px] border border-[#D5E5FA] bg-gradient-to-b from-[#EAF4FF] via-[#F4F9FF] to-[#DDEEFF] p-6 shadow-[0_12px_35px_rgba(30,72,130,0.06)]">
            <div>
              <p className="text-[25px] font-bold leading-[1.18] tracking-[-0.03em] text-[#102D62]">
                A Better
                <br />
                Shopping Experience
                <br />
                Starts with You!
              </p>
              <p className="mt-4 text-[12px] leading-5 text-[#718096]">
                Keep your profile updated to enjoy personalized offers,
                faster checkout and a seamless shopping experience.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
                  <Gift size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#102D62]">Personalized</p>
                  <p className="text-[11px] text-[#102D62]">Offers</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
                  <Zap size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#102D62]">Faster</p>
                  <p className="text-[11px] text-[#102D62]">Checkout</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
                  <Heart size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#102D62]">Exclusive</p>
                  <p className="text-[11px] text-[#102D62]">Deals</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1769F5] shadow-sm">
                  <Crown size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#102D62]">Priority</p>
                  <p className="text-[11px] text-[#102D62]">Support</p>
                </div>
              </div>
            </div>

            <div className="relative mt-7 flex h-[210px] items-end justify-center overflow-hidden rounded-[18px] bg-gradient-to-b from-[#DCEBFF] to-[#C8DFFF]">
              <div className="absolute left-1/2 top-5 h-[150px] w-[150px] -translate-x-1/2 rounded-full bg-[#B8D4FA]" />
              <div className="relative z-10 mb-[-25px] flex h-[155px] w-[125px] items-center justify-center rounded-t-[65px] bg-[#1769F5]">
                <div className="absolute -top-10 h-[75px] w-[75px] rounded-full border-[5px] border-[#102D62] bg-[#FFC08A]" />
                <div className="mt-12 h-[60px] w-[80px] rounded-[20px] bg-[#102D62]" />
                <div className="absolute right-[-15px] top-[65px] h-[50px] w-[28px] rotate-[-20deg] rounded-full bg-[#FFC08A]" />
              </div>
              <div className="absolute left-5 top-8 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#1769F5] shadow-lg">
                <ShoppingBag size={20} />
              </div>
              <div className="absolute right-5 top-12 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[#1769F5] shadow-lg">
                <Heart size={20} />
              </div>
            </div>

            <div className="mt-5 rounded-[15px] border border-white/80 bg-white/80 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#1769F5]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#102D62]">Complete your profile</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#718096]">
                    Get the best recommendations and never miss an offer!
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] font-semibold text-[#1769F5]">
              Shop More. Grow More.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
