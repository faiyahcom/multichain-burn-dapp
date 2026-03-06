import { IconCopy } from "@/assets/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  content: string;
  displayText?: string;
  classNames?: {
    container?: string;
  };
}

const CopyableText: React.FC<Props> = ({
  content,
  displayText,
  classNames,
}) => {
  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.75",
        classNames?.container,
      )}
    >
      <span className="text-sm" title={content}>
        {displayText ?? content}
      </span>
      <button onClick={handleCopy}>
        <IconCopy className="text-mb-copy-gray" />
      </button>
    </div>
  );
};

export default CopyableText;
