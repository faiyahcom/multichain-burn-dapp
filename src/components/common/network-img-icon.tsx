import { cn } from "@/lib/utils";

interface Props {
  src: string;
  className?: string;
}

const NetworkImgIcon: React.FC<Props> = ({ src, className }) => {
  return (
    <img
      src={src}
      className={cn("size-5.5 rounded-full object-cover", className)}
    />
  );
};

export default NetworkImgIcon;
