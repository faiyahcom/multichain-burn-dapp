import { cn } from "@/lib/utils";

interface Props {
  src?: string | undefined | null;
  alt?: string;
  classNames?: {
    common?: string;
    img?: string;
    placeholder?: string;
  };
}

const TokenImage: React.FC<Props> = ({ src, alt, classNames }) => {
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
