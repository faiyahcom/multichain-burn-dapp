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
  styles?: {
    common?: React.CSSProperties;
    img?: React.CSSProperties;
    placeholder?: React.CSSProperties;
  };
}

const TokenImage: React.FC<Props> = ({
  src,
  alt,
  classNames,
  isLoading,
  styles,
}) => {
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border border-active bg-inactive",
          classNames?.common,
          classNames?.placeholder,
        )}
        style={styles?.common}
      >
        <Spinner />
      </div>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || "token-image"}
        className={cn(
          "size-8 shrink-0 rounded-full object-cover",
          classNames?.common,
          classNames?.img,
        )}
        style={{
          ...styles?.common,
          ...styles?.img,
        }}
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
      style={{
        ...styles?.common,
        ...styles?.placeholder,
      }}
    />
  );
};

export default TokenImage;
