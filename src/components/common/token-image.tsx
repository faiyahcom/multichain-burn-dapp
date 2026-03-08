import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";

interface Props {
  src?: string | undefined | null;
  alt?: string;
  classNames?: {
    common?: string;
    img?: string;
    placeholder?: string;
  };
  isLoading?: boolean;
}

const TokenImage: React.FC<Props> = ({ src, alt, classNames, isLoading }) => {
  if (isLoading) {
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border border-active bg-inactive",
        classNames?.common,
        classNames?.placeholder,
      )}
    >
      <Spinner />
    </div>;
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || "token-image"}
        className={cn(
          "size-8 shrink-0 rounded-full",
          classNames?.common,
          classNames?.img,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "size-8 shrink-0 rounded-full border border-active bg-inactive",
        classNames?.common,
        classNames?.placeholder,
      )}
    />
  );
};

export default TokenImage;
