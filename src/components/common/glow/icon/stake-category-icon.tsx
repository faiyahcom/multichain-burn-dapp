import { IconStakeCategory } from "@/assets/react";

interface Props {
  className?: string;
}

const StakeCategoryIcon: React.FC<Props> = ({ className }) => {
  return <IconStakeCategory className={className} />;
};

export default StakeCategoryIcon;
