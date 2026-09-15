"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Upload,
  X,
  Eye,
  RotateCcw,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type ImageUploaderProps = {
  value?: string | null;

  onChange?: (
    value: string | null,
    file?: File
  ) => void;

  multiple?: boolean;

  maxFiles?: number;

  maxSizeMB?: number;

  accept?: string;

  label?: string;

  description?: string;

  className?: string;

  disabled?: boolean;
};

type PreviewItem = {
  id: string;
  url: string;
  file?: File;
};

// ============================================================
// DEFAULTS
// ============================================================

const DEFAULT_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif";

const DEFAULT_MAX_SIZE_MB = 5;

const DEFAULT_MAX_FILES = 5;

// ============================================================
// VALIDATION HELPERS
// ============================================================

function getSafeString(
  value: unknown,
  fallback: string
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();

  return cleaned || fallback;
}

function getSafeMaxSize(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  ) {
    return value;
  }

  return DEFAULT_MAX_SIZE_MB;
}

function getSafeMaxFiles(
  value: unknown
): number {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1
  ) {
    return Math.floor(value);
  }

  return DEFAULT_MAX_FILES;
}

function getSafeAccept(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return DEFAULT_ACCEPT;
  }

  return value;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ImageUploader({
  value = null,
  onChange,

  multiple = false,

  maxFiles = DEFAULT_MAX_FILES,

  maxSizeMB = DEFAULT_MAX_SIZE_MB,

  accept = DEFAULT_ACCEPT,

  label = "Product Image",

  description = "PNG, JPG, WEBP or GIF. Maximum 5MB.",

  className = "",

  disabled = false,
}: ImageUploaderProps) {
  // ==========================================================
  // SAFE PROPS
  // ==========================================================

  const safeMaxSizeMB =
    getSafeMaxSize(maxSizeMB);

  const safeMaxFiles =
    getSafeMaxFiles(maxFiles);

  const safeAccept =
    getSafeAccept(accept);

  const safeLabel =
    getSafeString(
      label,
      "Product Image"
    );

  const safeDescription =
    getSafeString(
      description,
      `PNG, JPG, WEBP or GIF. Maximum ${safeMaxSizeMB}MB.`
    );

  const safeClassName =
    typeof className === "string"
      ? className.trim()
      : "";

  // ==========================================================
  // REFS
  // ==========================================================

  const inputRef =
    useRef<HTMLInputElement>(null);

  const objectUrlsRef =
    useRef<Set<string>>(new Set());

  // ==========================================================
  // STATE
  // ==========================================================

  const [images, setImages] =
    useState<PreviewItem[]>([]);

  const [dragging, setDragging] =
    useState(false);

  const [error, setError] =
    useState("");

  const [previewImage, setPreviewImage] =
    useState<string | null>(null);

  // ==========================================================
  // ACCEPTED FILE TYPES
  // ==========================================================

  const acceptedTypes =
    safeAccept
      .split(",")
      .map((item) =>
        item.trim().toLowerCase()
      )
      .filter(Boolean);

  // ==========================================================
  // VALIDATE FILE TYPE
  // ==========================================================

  const isAcceptedFileType = useCallback(
    (file: File) => {
      if (!file) {
        return false;
      }

      /*
       * If no accept restriction exists,
       * allow the browser-selected file.
       */
      if (
        acceptedTypes.length === 0
      ) {
        return true;
      }

      const fileType =
        typeof file.type === "string"
          ? file.type
              .trim()
              .toLowerCase()
          : "";

      const fileName =
        typeof file.name === "string"
          ? file.name
              .trim()
              .toLowerCase()
          : "";

      return acceptedTypes.some(
        (type) => {
          // image/*
          if (type.endsWith("/*")) {
            const prefix =
              type.slice(0, -1);

            return fileType.startsWith(
              prefix
            );
          }

          // MIME type
          if (type.includes("/")) {
            return (
              fileType === type
            );
          }

          // Extension such as .jpg
          if (type.startsWith(".")) {
            return fileName.endsWith(
              type
            );
          }

          return false;
        }
      );
    },
    [acceptedTypes]
  );

  // ==========================================================
  // VALIDATE FILE
  // ==========================================================

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file) {
        return "Please select a valid image.";
      }

      if (
        !isAcceptedFileType(file)
      ) {
        return `${file.name || "Selected file"}: Unsupported image format.`;
      }

      const maxBytes =
        safeMaxSizeMB *
        1024 *
        1024;

      if (
        !Number.isFinite(file.size) ||
        file.size <= 0
      ) {
        return `${file.name || "Selected file"}: Image file is empty or invalid.`;
      }

      if (
        file.size > maxBytes
      ) {
        return `${file.name}: Image must be smaller than ${safeMaxSizeMB}MB.`;
      }

      return null;
    },
    [
      isAcceptedFileType,
      safeMaxSizeMB,
    ]
  );

  // ==========================================================
  // CREATE OBJECT URL
  // ==========================================================

  const createPreviewUrl = useCallback(
    (file: File) => {
      const url =
        URL.createObjectURL(file);

      objectUrlsRef.current.add(
        url
      );

      return url;
    },
    []
  );

  // ==========================================================
  // REVOKE OBJECT URL
  // ==========================================================

  const revokeObjectUrl = useCallback(
    (url: string) => {
      if (
        !url ||
        !url.startsWith("blob:")
      ) {
        return;
      }

      URL.revokeObjectURL(url);

      objectUrlsRef.current.delete(
        url
      );
    },
    []
  );

  // ==========================================================
  // ADD FILES
  // ==========================================================

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) {
        return;
      }

      setError("");

      const selectedFiles =
        Array.from(fileList).filter(
          (file): file is File =>
            file instanceof File
        );

      if (
        selectedFiles.length === 0
      ) {
        setError(
          "Please select at least one image."
        );
        return;
      }

      // ======================================================
      // VALIDATE FILES
      // ======================================================

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of selectedFiles) {
        const validationError =
          validateFile(file);

        if (validationError) {
          errors.push(
            validationError
          );
          continue;
        }

        validFiles.push(file);
      }

      if (
        errors.length > 0
      ) {
        setError(errors[0]);
      }

      if (
        validFiles.length === 0
      ) {
        return;
      }

      // ======================================================
      // SINGLE IMAGE
      // ======================================================

      if (!multiple) {
        const file =
          validFiles[0];

        const url =
          createPreviewUrl(file);

        const newImage: PreviewItem = {
          id: `${file.name}-${file.lastModified}-${Math.random()
            .toString(36)
            .slice(2)}`,
          url,
          file,
        };

        setImages((current) => {
          current.forEach(
            (image) => {
              if (
                image.file &&
                image.url.startsWith(
                  "blob:"
                )
              ) {
                revokeObjectUrl(
                  image.url
                );
              }
            }
          );

          return [newImage];
        });

        onChange?.(
          url,
          file
        );

        return;
      }

      // ======================================================
      // MULTIPLE IMAGES
      // ======================================================

      setImages((current) => {
        const availableSlots =
          Math.max(
            0,
            safeMaxFiles -
              current.length
          );

        if (
          availableSlots === 0
        ) {
          setError(
            `You can upload a maximum of ${safeMaxFiles} images.`
          );

          return current;
        }

        const filesToAdd =
          validFiles.slice(
            0,
            availableSlots
          );

        if (
          filesToAdd.length <
          validFiles.length
        ) {
          setError(
            `You can upload a maximum of ${safeMaxFiles} images.`
          );
        }

        const newImages =
          filesToAdd.map(
            (file) => ({
              id: `${file.name}-${file.lastModified}-${Math.random()
                .toString(36)
                .slice(2)}`,
              url: createPreviewUrl(
                file
              ),
              file,
            })
          );

        return [
          ...current,
          ...newImages,
        ];
      });
    },
    [
      disabled,
      multiple,
      safeMaxFiles,
      validateFile,
      createPreviewUrl,
      revokeObjectUrl,
      onChange,
    ]
  );

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (disabled) {
      event.target.value = "";
      return;
    }

    const files =
      event.target.files;

    if (!files) {
      return;
    }

    addFiles(files);

    // Allow selecting same file again.
    event.target.value = "";
  };

  // ==========================================================
  // DRAG ENTER
  // ==========================================================

  const handleDragEnter = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      setDragging(true);
    }
  };

  // ==========================================================
  // DRAG OVER
  // ==========================================================

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!disabled) {
      setDragging(true);
    }
  };

  // ==========================================================
  // DRAG LEAVE
  // ==========================================================

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);
  };

  // ==========================================================
  // DROP
  // ==========================================================

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setDragging(false);

    if (disabled) {
      return;
    }

    const files =
      event.dataTransfer?.files;

    if (
      files &&
      files.length > 0
    ) {
      addFiles(files);
    }
  };

  // ==========================================================
  // REMOVE IMAGE
  // ==========================================================

  const removeImage = (
    id: string
  ) => {
    if (disabled) {
      return;
    }

    setImages((current) => {
      const image =
        current.find(
          (item) =>
            item.id === id
        );

      if (!image) {
        return current;
      }

      if (
        image.file &&
        image.url.startsWith(
          "blob:"
        )
      ) {
        revokeObjectUrl(
          image.url
        );
      }

      if (
        previewImage ===
        image.url
      ) {
        setPreviewImage(null);
      }

      const next =
        current.filter(
          (item) =>
            item.id !== id
        );

      if (!multiple) {
        onChange?.(
          null,
          undefined
        );
      }

      return next;
    });
  };

  // ==========================================================
  // RESET ALL IMAGES
  // ==========================================================

  const resetImages = () => {
    if (disabled) {
      return;
    }

    images.forEach(
      (image) => {
        if (
          image.file &&
          image.url.startsWith(
            "blob:"
          )
        ) {
          revokeObjectUrl(
            image.url
          );
        }
      }
    );

    setImages([]);
    setError("");
    setPreviewImage(null);

    onChange?.(
      null,
      undefined
    );
  };

  // ==========================================================
  // OPEN FILE PICKER
  // ==========================================================

  const openFilePicker = () => {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  };

  // ==========================================================
  // INITIAL VALUE / EXTERNAL VALUE
  // ==========================================================

  useEffect(() => {
    if (
      !value ||
      typeof value !== "string" ||
      !value.trim()
    ) {
      return;
    }

    const normalizedValue =
      value.trim();

    setImages((current) => {
      /*
       * Do not duplicate external image.
       */
      if (
        current.some(
          (image) =>
            image.url ===
            normalizedValue
        )
      ) {
        return current;
      }

      /*
       * Single mode should only
       * display one external image.
       */
      if (!multiple) {
        current.forEach(
          (image) => {
            if (
              image.file &&
              image.url.startsWith(
                "blob:"
              )
            ) {
              revokeObjectUrl(
                image.url
              );
            }
          }
        );

        return [
          {
            id: `initial-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,
            url: normalizedValue,
          },
        ];
      }

      /*
       * Multiple mode.
       */
      if (
        current.length >=
        safeMaxFiles
      ) {
        return current;
      }

      return [
        ...current,
        {
          id: `initial-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          url: normalizedValue,
        },
      ];
    });
  }, [
    value,
    multiple,
    safeMaxFiles,
    revokeObjectUrl,
  ]);

  // ==========================================================
  // CLEANUP ON UNMOUNT
  // ==========================================================

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(url);
        }
      );

      objectUrlsRef.current.clear();
    };
  }, []);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <div
        className={`
          w-full
          ${safeClassName}
        `}
      >
        {/* ====================================================
            LABEL
        ===================================================== */}

        <div
          className="
            mb-2
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-semibold
                text-[#52627A]
              "
            >
              {safeLabel}
            </p>

            <p
              className="
                mt-1
                text-[8px]
                leading-4
                text-[#9AA5B4]
              "
            >
              {safeDescription}
            </p>
          </div>

          {images.length > 0 && (
            <button
              type="button"
              onClick={resetImages}
              disabled={disabled}
              className="
                flex
                items-center
                gap-1
                text-[8px]
                font-semibold
                text-[#D85A5A]
                hover:underline
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              <RotateCcw size={11} />
              Remove All
            </button>
          )}
        </div>

        {/* ====================================================
            UPLOAD AREA
        ===================================================== */}

        <div
          onDragEnter={
            handleDragEnter
          }
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={handleDrop}
          className={`
            relative
            rounded-xl
            border-2
            border-dashed
            transition
            ${
              dragging
                ? "border-[#1769F5] bg-[#F0F6FF]"
                : "border-[#DCE2EA] bg-[#FAFBFD]"
            }
            ${
              disabled
                ? "cursor-not-allowed opacity-60"
                : ""
            }
          `}
        >
          {/* ==================================================
              PREVIEWS
          =================================================== */}

          {images.length > 0 ? (
            <div className="p-3">
              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                  sm:grid-cols-3
                  lg:grid-cols-4
                "
              >
                {images.map(
                  (image) => (
                    <div
                      key={image.id}
                      className="
                        group
                        relative
                        aspect-square
                        overflow-hidden
                        rounded-lg
                        border
                        border-[#E1E6ED]
                        bg-white
                      "
                    >
                      {/* IMAGE */}

                      <img
                        src={image.url}
                        alt={`${safeLabel} preview`}
                        className="
                          h-full
                          w-full
                          object-contain
                          p-2
                        "
                        onError={() => {
                          setError(
                            "Unable to load this image preview."
                          );
                        }}
                      />

                      {/* HOVER ACTIONS */}

                      <div
                        className="
                          absolute
                          inset-0
                          flex
                          items-center
                          justify-center
                          gap-2
                          bg-black/40
                          opacity-0
                          transition
                          group-hover:opacity-100
                          group-focus-within:opacity-100
                        "
                      >
                        {/* VIEW */}

                        <button
                          type="button"
                          onClick={() =>
                            setPreviewImage(
                              image.url
                            )
                          }
                          className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-[#263650]
                            shadow
                            hover:bg-[#F2F5F8]
                          "
                          aria-label="Preview image"
                        >
                          <Eye
                            size={14}
                          />
                        </button>

                        {/* REMOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(
                              image.id
                            )
                          }
                          disabled={
                            disabled
                          }
                          className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-[#D85A5A]
                            shadow
                            hover:bg-[#FFF0F0]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                          aria-label="Remove image"
                        >
                          <X
                            size={14}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {/* ==================================================
                    ADD MORE
                =================================================== */}

                {multiple &&
                  images.length <
                    safeMaxFiles && (
                    <button
                      type="button"
                      onClick={
                        openFilePicker
                      }
                      disabled={
                        disabled
                      }
                      className="
                        aspect-square
                        rounded-lg
                        border
                        border-dashed
                        border-[#DCE2EA]
                        bg-[#FAFBFD]
                        transition
                        hover:border-[#8AA9DE]
                        hover:bg-[#F5F8FC]
                        disabled:cursor-not-allowed
                      "
                    >
                      <ImagePlus
                        size={22}
                        className="
                          mx-auto
                          text-[#8090A6]
                        "
                      />

                      <p
                        className="
                          mt-2
                          text-[8px]
                          font-semibold
                          text-[#66748B]
                        "
                      >
                        Add Image
                      </p>
                    </button>
                  )}
              </div>

              {/* CHANGE IMAGE */}

              {!multiple && (
                <button
                  type="button"
                  onClick={
                    openFilePicker
                  }
                  disabled={
                    disabled
                  }
                  className="
                    mt-3
                    flex
                    h-9
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-[#DCE2EA]
                    bg-white
                    text-[9px]
                    font-semibold
                    text-[#52627A]
                    transition
                    hover:bg-[#F5F7FA]
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Upload size={14} />
                  Change Image
                </button>
              )}
            </div>
          ) : (
            /* =================================================
               EMPTY UPLOAD
            ================================================== */

            <button
              type="button"
              onClick={
                openFilePicker
              }
              disabled={disabled}
              className="
                flex
                min-h-[180px]
                w-full
                flex-col
                items-center
                justify-center
                px-5
                py-8
                text-center
                disabled:cursor-not-allowed
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EDF3FF]
                  text-[#1769F5]
                "
              >
                <ImagePlus size={23} />
              </div>

              <p
                className="
                  mt-3
                  text-[10px]
                  font-semibold
                  text-[#52627A]
                "
              >
                Click to upload
              </p>

              <p
                className="
                  mt-1
                  text-[9px]
                  text-[#8995A5]
                "
              >
                or drag and drop your image here
              </p>

              <div
                className="
                  mt-3
                  flex
                  items-center
                  gap-1.5
                  text-[8px]
                  text-[#9AA5B4]
                "
              >
                <Upload size={11} />

                Maximum {safeMaxSizeMB}MB

                {multiple &&
                  ` • Up to ${safeMaxFiles} images`}
              </div>
            </button>
          )}

          {/* ==================================================
              HIDDEN INPUT
          =================================================== */}

          <input
            ref={inputRef}
            type="file"
            accept={safeAccept}
            multiple={multiple}
            onChange={
              handleInputChange
            }
            disabled={disabled}
            className="hidden"
          />
        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div
            role="alert"
            className="
              mt-2
              rounded-lg
              bg-[#FFF0F0]
              px-3
              py-2.5
            "
          >
            <p
              className="
                text-[9px]
                font-medium
                leading-4
                text-[#D85A5A]
              "
            >
              {error}
            </p>
          </div>
        )}

        {/* ====================================================
            IMAGE COUNT
        ===================================================== */}

        {multiple &&
          images.length > 0 && (
            <p
              className="
                mt-2
                text-right
                text-[8px]
                text-[#8995A5]
              "
            >
              {images.length} /{" "}
              {safeMaxFiles} images
            </p>
          )}
      </div>

      {/* ======================================================
          FULL IMAGE PREVIEW
      ======================================================= */}

      {previewImage && (
        <div
          className="
            fixed
            inset-0
            z-[300]
            flex
            items-center
            justify-center
            bg-black/70
            p-4
          "
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() =>
            setPreviewImage(null)
          }
        >
          {/* CLOSE */}

          <button
            type="button"
            onClick={() =>
              setPreviewImage(null)
            }
            className="
              absolute
              right-4
              top-4
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-white
              text-[#263650]
              shadow-lg
              hover:bg-[#F2F5F8]
            "
            aria-label="Close preview"
          >
            <X size={18} />
          </button>

          {/* IMAGE */}

          <img
            src={previewImage}
            alt="Full image preview"
            onClick={(event) =>
              event.stopPropagation()
            }
            className="
              max-h-[85vh]
              max-w-[92vw]
              rounded-xl
              bg-white
              object-contain
              shadow-2xl
            "
          />
        </div>
      )}
    </>
  );
}