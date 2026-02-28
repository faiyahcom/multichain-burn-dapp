import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

const NetworkImgIcon: React.FC<Props> = ({ src, className, alt }) => {
  return (
    <img
      src={src}
      className={cn("size-5.5 shrink-0 rounded-full object-cover", className)}
      alt={alt}
    />
  );
};

export default NetworkImgIcon;
