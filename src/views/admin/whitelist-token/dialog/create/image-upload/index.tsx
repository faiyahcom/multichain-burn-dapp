import { IconUpload2 } from "@/assets/react";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface Props {
  img?: File;
  onChange?: (img?: File) => void;
  placeholder?: string;
  /** Pre-existing image URL (e.g. from server) shown when no File is selected */
  initialUrl?: string;
  /** Called when the user removes the pre-existing image */
  onRemoveInitialUrl?: () => void;
}

const ImageUpload: React.FC<Props> = ({ img, onChange, placeholder, initialUrl, onRemoveInitialUrl }) => {
  const id = useId();
  const [url, setUrl] = useState<string>("");
  const [showInitial, setShowInitial] = useState<boolean>(!!initialUrl);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setShowInitial(false);
    onChange?.(file);
  };

  const handleRemove = () => {
    setShowInitial(false);
    onRemoveInitialUrl?.();
    onChange?.(undefined);
  };

  useEffect(() => {
    if (img) {
      const newObjectUrl = URL.createObjectURL(img);
      if (url) {
        // revoke the old object url
        URL.revokeObjectURL(url);
      }
      setUrl(newObjectUrl);
      setShowInitial(false);
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

  // Reset showInitial when initialUrl changes (e.g. dialog re-opens with new token)
  useEffect(() => {
    setShowInitial(!!initialUrl);
  }, [initialUrl]);

  const displayUrl = url || (showInitial ? initialUrl : "");

  if (displayUrl) {
    return (
      <>
        <label
          htmlFor={id}
          className="relative aspect-square size-17.75! cursor-pointer overflow-hidden rounded-md-plus"
        >
          <img src={displayUrl} alt="Image" className="h-full w-full object-cover" />
          <Button
            size={"icon-xs"}
            className="absolute top-1 right-1 bg-mb-danger hover:bg-mb-danger"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleRemove();
            }}
          >
            <XIcon className="text-primary-foreground" />
          </Button>
        </label>
        <input
          type="file"
          name="file"
          id={id}
          hidden
          onChange={handleOnChange}
          accept="image/*"
        />
      </>
    );
  }

  return (
    <>
      <label
        className="flex h-17.75 w-full cursor-pointer items-center justify-center gap-2.75 rounded-md-plus bg-inactive text-secondary-text"
        htmlFor={id}
      >
        <IconUpload2 />
        <span className="text-15px font-normal">{placeholder}</span>
      </label>
      <input
        type="file"
        name="file"
        id={id}
        hidden
        onChange={handleOnChange}
        accept="image/*"
      />
    </>
  );
};

export default ImageUpload;
