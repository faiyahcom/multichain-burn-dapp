import { IconUpload2 } from "@/assets/react";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";

interface Props {
  img?: File;
  onChange?: (img?: File) => void;
  placeholder?: string;
}

const ImageUpload: React.FC<Props> = ({ img, onChange, placeholder }) => {
  const id = useId();
  const [url, setUrl] = useState<string>("");

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onChange?.(file);
  };

  const handleRemove = () => {
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

  if (url) {
    return (
      <>
        <label
          htmlFor={id}
          className="relative aspect-square size-17.75! cursor-pointer overflow-hidden rounded-md-plus"
        >
          <img src={url} alt="Image" className="h-full w-full object-cover" />
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
      <input type="file" name="file" id={id} hidden onChange={handleOnChange} />
    </>
  );
};

export default ImageUpload;
