import { IconCopy } from "@/assets/react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/common/custom-toast";

interface Props {
  content?: string;
  displayText?: string;
  classNames?: {
    container?: string;
    displayText?: string;
    icon?: string;
  };
}

const CopyableText: React.FC<Props> = ({
  content,
  displayText,
  classNames,
}) => {
  const handleCopy = () => {
    if (!content) return;
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
      <span
        className={cn("text-sm text-mb-gray-profile", classNames?.displayText)}
        title={content}
      >
        {displayText ?? content}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
      >
        <IconCopy className={cn("text-mb-gray-profile", classNames?.icon)} />
      </button>
    </div>
  );
};

export default CopyableText;
