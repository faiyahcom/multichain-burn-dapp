import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

const NetworkImgIcon: React.FC<Props> = ({ src, className, alt, style }) => {
  return (
    <img
      src={src}
      className={cn("size-5.5 shrink-0 rounded-full object-cover", className)}
      alt={alt}
      style={style}
    />
  );
};

export default NetworkImgIcon;
