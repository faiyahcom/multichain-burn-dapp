import { useEffect, useId, useState } from "react";
import TokenImage from "./token-image";
import { cn } from "@/lib/utils";
import { IconWhiteCamera } from "@/assets/react";

interface Props {
  img?: string | File | null;
  onChange?: (img?: string | File) => void;
  placeholderSrc?: string;
  alt?: string;
  id?: string;
  classNames?: {
    container?: string;
  };
  isLoading?: boolean;
}

const SingleImageUpload: React.FC<Props> = ({
  img,
  onChange,
  placeholderSrc,
  alt = "image",
  id,
  classNames,
  isLoading,
}) => {
  const reactId = useId();
  const finalId = id || reactId;
  const [url, setUrl] = useState<string>("");

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onChange?.(file);

    e.target.value = "";
  };

  useEffect(() => {
    if (img) {
      if (typeof img === "string") {
        setUrl(img);
      } else {
        const newObjectUrl = URL.createObjectURL(img);
        if (url) {
          // revoke the old object url
          URL.revokeObjectURL(url);
        }
        setUrl(newObjectUrl);
      }
    } else {
      if (url) {
        URL.revokeObjectURL(url);
        setUrl("");
      }
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
        setUrl("");
      }
    };
  }, [img]);

  return (
    <>
      <div
        className={cn(
          "group relative aspect-square size-21.25! shrink-0",
          classNames?.container,
        )}
      >
        <TokenImage
          src={url || placeholderSrc}
          alt={alt}
          classNames={{
            common: "size-21.25",
          }}
          isLoading={isLoading}
        />
        <label
          htmlFor={finalId}
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center rounded-full bg-foreground/50",
            "opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            "cursor-pointer",
          )}
        >
          <IconWhiteCamera />
        </label>
      </div>
      <input
        type="file"
        name="file"
        id={finalId}
        hidden
        accept="image/*"
        onChange={handleOnChange}
      />
    </>
  );
};

export default SingleImageUpload;
