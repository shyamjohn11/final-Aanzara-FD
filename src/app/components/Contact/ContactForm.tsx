// File: src/app/components/Contact/ContactForm.tsx

"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Lock } from "lucide-react";
import { enquiriesApi } from "@/app/api/services";
import { SUBJECT_OPTIONS } from "@/app/data/contact";

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 150;
const MAX_PHONE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 1000;

const MIN_NAME_LENGTH = 2;
const MIN_MESSAGE_LENGTH = 10;

// No backend endpoint publishes the subject catalogue, so live
// subjects (#131 enquiriesApi.list) are used with built-in
// fallbacks that keep the form enabled.
const FALLBACK_SUBJECTS: string[] = [
  "Order Support",
  "Product Enquiry",
  "Bulk / Business Order",
  "Payment & Refund",
  "Delivery Issue",
  "General Support",
];

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

function normalizeSubjects(values: unknown[]): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0 || unique.has(trimmed)) {
      continue;
    }

    unique.add(trimmed);
  }

  return [...unique];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function extractEnquiryRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["items", "enquiries", "data"]) {
      const nested = payload[key];

      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return [];
}

function validateName(value: string): string {
  const name = value.trim();

  if (!name) return "Full name is required.";
  if (name.length < MIN_NAME_LENGTH)
    return `Full name must contain at least ${MIN_NAME_LENGTH} characters.`;
  if (name.length > MAX_NAME_LENGTH)
    return `Full name must be ${MAX_NAME_LENGTH} characters or less.`;
  if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(name))
    return "Please enter a valid name.";

  return "";
}

function validateEmail(value: string): string {
  const email = value.trim();

  if (!email) return "Email address is required.";
  if (email.length > MAX_EMAIL_LENGTH)
    return `Email address must be ${MAX_EMAIL_LENGTH} characters or less.`;

  const emailRegex =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

  if (!emailRegex.test(email)) return "Please enter a valid email address.";

  return "";
}

function validatePhone(value: string): string {
  const phone = value.trim();

  if (!phone) return "Mobile number is required.";
  if (!/^[6-9]\d{9}$/.test(phone))
    return "Please enter a valid 10-digit mobile number.";

  return "";
}

function validateSubject(value: string, allowed: string[]): string {
  const subject = value.trim();

  if (!subject) return "Please select a subject.";
  if (!allowed.includes(subject)) return "Please select a valid subject.";

  return "";
}

function validateMessage(value: string): string {
  const message = value.trim();

  if (!message) return "Message is required.";
  if (message.length < MIN_MESSAGE_LENGTH)
    return `Message must contain at least ${MIN_MESSAGE_LENGTH} characters.`;
  if (message.length > MAX_MESSAGE_LENGTH)
    return `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`;

  return "";
}

function validateForm(form: FormData, allowed: string[]): FormErrors {
  const newErrors: FormErrors = {};

  const nameError = validateName(form.name);
  const emailError = validateEmail(form.email);
  const phoneError = validatePhone(form.phone);
  const subjectError = validateSubject(form.subject, allowed);
  const messageError = validateMessage(form.message);

  if (nameError) newErrors.name = nameError;
  if (emailError) newErrors.email = emailError;
  if (phoneError) newErrors.phone = phoneError;
  if (subjectError) newErrors.subject = subjectError;
  if (messageError) newErrors.message = messageError;

  return newErrors;
}

export default function ContactForm() {
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<string[]>(() =>
    normalizeSubjects([...SUBJECT_OPTIONS, ...FALLBACK_SUBJECTS]),
  );
  const [subjectsLoading, setSubjectsLoading] = useState(true);

  // =====================================================
  // LIVE SUBJECTS — #131 enquiriesApi.list()
  // (static + fallback subjects keep the form enabled)
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await enquiriesApi.list(1, 50);
        const live = normalizeSubjects(
          extractEnquiryRows(data).flatMap((row) => [
            row["subject"],
            row["category"],
            row["type"],
            row["topic"],
          ]),
        );

        if (!cancelled && live.length > 0) {
          setSubjects((current) =>
            normalizeSubjects([
              ...live,
              ...current,
              ...SUBJECT_OPTIONS,
            ]),
          );
        }
      } catch {
        // Static + fallback subjects keep the form enabled.
      } finally {
        if (!cancelled) {
          setSubjectsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // AUTO-FILL SUBJECT FROM URL (?topic=...)
  // =====================================================

  useEffect(() => {
    const topic = searchParams.get("topic");

    if (!topic) return;

    // Match against valid subjects (case-insensitive, trimmed).
    const matched = subjects.find(
      (subject) => subject.toLowerCase() === topic.trim().toLowerCase()
    );

    if (matched) {
      setForm((prev) => ({ ...prev, subject: matched }));
      setErrors((prev) => ({ ...prev, subject: undefined }));
    }
  }, [searchParams, subjects]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (!Object.prototype.hasOwnProperty.call(initialForm, name)) {
      return;
    }

    let nextValue = value;

    if (name === "name") {
      nextValue = value.slice(0, MAX_NAME_LENGTH);
    }

    if (name === "email") {
      nextValue = value.slice(0, MAX_EMAIL_LENGTH);
    }

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, MAX_PHONE_LENGTH);
    }

    if (name === "subject") {
      nextValue = value;
    }

    if (name === "message") {
      nextValue = value.slice(0, MAX_MESSAGE_LENGTH);
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitted(false);
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const field = e.target.name as keyof FormData;

    let error = "";

    switch (field) {
      case "name":
        error = validateName(form.name);
        break;
      case "email":
        error = validateEmail(form.email);
        break;
      case "phone":
        error = validatePhone(form.phone);
        break;
      case "subject":
        error = validateSubject(form.subject, subjects);
        break;
      case "message":
        error = validateMessage(form.message);
        break;
      default:
        return;
    }

    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    setSubmitted(false);

    const validationErrors = validateForm(form, subjects);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      };

      // Live submit — POST /api/admin/enquiries.
      await enquiriesApi.create(payload);

      setSubmitted(true);
      setForm({ ...initialForm });
      setErrors({});
    } catch (error) {
      console.error("Contact form submission failed:", error);

      setErrors({
        message:
          "Unable to send your message right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError?: string) =>
    `w-full rounded-lg border px-4 py-3 text-[13px] outline-none transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-500"
        : "border-line focus:border-blue"
    }`;

  return (
    <section
      id="contact-form"
      aria-labelledby="contact-form-title"
      className="bg-white border border-line rounded-card p-5 sm:p-6"
    >
      <h2
        id="contact-form-title"
        className="font-sora font-bold text-[17px] text-navy"
      >
        Send Us a Message
      </h2>

      <p className="text-[12px] text-ink-soft mt-1">
        Fill out the form and our team will get back to you.
      </p>

      {submitted && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg border border-green/30 bg-green/10 px-4 py-3 text-[12.5px] font-medium text-green-deep"
        >
          Your message has been sent successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* NAME */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[12.5px] font-semibold text-ink"
            >
              Full Name <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your full name"
              autoComplete="name"
              maxLength={MAX_NAME_LENGTH}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={fieldClass(errors.name)}
            />

            {errors.name && (
              <p id="name-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[12.5px] font-semibold text-ink"
            >
              Email Address <span className="text-red-500">*</span>
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your email address"
              autoComplete="email"
              maxLength={MAX_EMAIL_LENGTH}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={fieldClass(errors.email)}
            />

            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PHONE */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-[12.5px] font-semibold text-ink"
            >
              Mobile Number <span className="text-red-500">*</span>
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter your 10-digit mobile number"
              autoComplete="tel"
              inputMode="numeric"
              maxLength={MAX_PHONE_LENGTH}
              aria-invalid={errors.phone ? "true" : "false"}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={fieldClass(errors.phone)}
            />

            {errors.phone && (
              <p id="phone-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.phone}
              </p>
            )}
          </div>

          {/* SUBJECT */}
          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-[12.5px] font-semibold text-ink"
            >
              Subject <span className="text-red-500">*</span>
            </label>

            <select
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={subjectsLoading}
              aria-invalid={errors.subject ? "true" : "false"}
              aria-describedby={errors.subject ? "subject-error" : undefined}
              className={`${fieldClass(errors.subject)} bg-white disabled:opacity-60 ${
                form.subject ? "text-ink" : "text-ink-faint"
              }`}
            >
              <option value="">
                {subjectsLoading ? "Loading subjects..." : "Select a subject"}
              </option>

              {subjects.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.subject && (
              <p id="subject-error" role="alert" className="mt-1.5 text-[11px] text-red-500">
                {errors.subject}
              </p>
            )}

            {subjects.length === 0 && !subjectsLoading && (
              <p role="alert" className="mt-1.5 text-[11px] text-red-500">
                No subject options are currently available.
              </p>
            )}
          </div>
        </div>

        {/* MESSAGE */}
        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-[12.5px] font-semibold text-ink"
          >
            Message <span className="text-red-500">*</span>
          </label>

          <textarea
            id="message"
            name="message"
            rows={4}
            value={form.message}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Type your message here..."
            maxLength={MAX_MESSAGE_LENGTH}
            aria-invalid={errors.message ? "true" : "false"}
            aria-describedby={errors.message ? "message-error" : "message-count"}
            className={`${fieldClass(errors.message)} resize-none`}
          />

          <div className="flex items-center justify-between mt-1">
            {errors.message ? (
              <p id="message-error" role="alert" className="text-[11px] text-red-500">
                {errors.message}
              </p>
            ) : (
              <span />
            )}

            <span id="message-count" className="text-[10px] text-ink-faint">
              {form.message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex flex-wrap items-center gap-4 mt-1">
          <button
            type="submit"
            disabled={isSubmitting || subjectsLoading || subjects.length === 0}
            aria-disabled={isSubmitting || subjectsLoading || subjects.length === 0}
            className="flex items-center gap-2 bg-navy hover:bg-navy-deep transition-colors text-white text-[13px] font-bold px-6 py-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>

          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-soft">
            <Lock size={12} />
            Your information is safe with us.
          </span>
        </div>
      </form>
    </section>
  );
}
