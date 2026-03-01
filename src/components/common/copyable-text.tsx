import { IconCopy } from "@/assets/react";
import { toast } from "sonner";

interface Props {
  content: string;
  displayText?: string;
}

const CopyableText: React.FC<Props> = ({ content, displayText }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success("Copied to clipboard");
    });
  };

  return (
    <div className="flex items-center justify-center gap-1.75">
      <span className="text-sm">{displayText ?? content}</span>
      <button onClick={handleCopy}>
        <IconCopy className="text-mb-copy-gray" />
      </button>
    </div>
  );
};

export default CopyableText;
